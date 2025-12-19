#!/bin/bash

# Cleanup script to remove ECS client service and related resources
# Run this after verifying Amplify deployment works

set -e

# Configuration
AWS_REGION="eu-north-1"
CLUSTER_NAME="file-upload-cluster-1"
SERVICE_NAME_CLIENT="file-upload-client-service"
TASK_DEFINITION_CLIENT="file-upload-client"
ECR_REPOSITORY_CLIENT="file-upload-client"
CLIENT_TARGET_GROUP_NAME="file-upload-client-tg"  # Update with your actual target group name

echo "========================================="
echo "ECS Client Cleanup Script"
echo "========================================="
echo ""
echo "This script will:"
echo "1. Scale down client service to 0"
echo "2. Delete client ECS service"
echo "3. Deregister client task definitions"
echo "4. Delete client ECR repository (optional)"
echo "5. Delete client target group (manual step required)"
echo ""
read -p "Are you sure you want to proceed? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cleanup cancelled."
    exit 0
fi

# Step 1: Scale down service to 0
echo ""
echo "Step 1: Scaling down client service to 0..."
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_NAME_CLIENT \
  --desired-count 0 \
  --region $AWS_REGION || echo "⚠️  Service may not exist or already scaled down"

echo "Waiting for tasks to stop..."
sleep 10

# Step 2: Delete ECS service
echo ""
echo "Step 2: Deleting client ECS service..."
aws ecs delete-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_NAME_CLIENT \
  --force \
  --region $AWS_REGION || echo "⚠️  Service may not exist"

echo "Waiting for service deletion..."
sleep 5

# Step 3: List and deregister task definitions
echo ""
echo "Step 3: Deregistering client task definitions..."
TASK_DEFINITIONS=$(aws ecs list-task-definitions \
  --family-prefix $TASK_DEFINITION_CLIENT \
  --region $AWS_REGION \
  --query 'taskDefinitionArns[]' \
  --output text)

if [ -n "$TASK_DEFINITIONS" ]; then
    for TASK_DEF in $TASK_DEFINITIONS; do
        echo "Deregistering: $TASK_DEF"
        aws ecs deregister-task-definition \
          --task-definition $TASK_DEF \
          --region $AWS_REGION || echo "⚠️  Failed to deregister: $TASK_DEF"
    done
else
    echo "No task definitions found for $TASK_DEFINITION_CLIENT"
fi

# Step 4: Delete ECR repository (optional)
echo ""
read -p "Do you want to delete the client ECR repository? (yes/no): " delete_ecr

if [ "$delete_ecr" == "yes" ]; then
    echo "Deleting ECR repository: $ECR_REPOSITORY_CLIENT"
    aws ecr delete-repository \
      --repository-name $ECR_REPOSITORY_CLIENT \
      --force \
      --region $AWS_REGION || echo "⚠️  Repository may not exist"
else
    echo "Skipping ECR repository deletion"
fi

# Step 5: Instructions for manual cleanup
echo ""
echo "========================================="
echo "Manual Cleanup Required:"
echo "========================================="
echo ""
echo "1. Delete Client Target Group:"
echo "   - Go to EC2 Console → Target Groups"
echo "   - Find: $CLIENT_TARGET_GROUP_NAME"
echo "   - Delete it"
echo ""
echo "2. Update ALB Listener Rules:"
echo "   - Go to EC2 Console → Load Balancers"
echo "   - Select your ALB → Listeners → HTTP:80"
echo "   - Remove default rule pointing to client target group"
echo "   - Keep only /api/* rule pointing to server"
echo ""
echo "3. (Optional) Delete CloudWatch Log Group:"
echo "   aws logs delete-log-group --log-group-name /ecs/file-upload-client --region $AWS_REGION"
echo ""
echo "========================================="
echo "Cleanup completed!"
echo "========================================="

