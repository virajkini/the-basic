#!/bin/bash

# Configuration
AWS_REGION="eu-north-1"
CLUSTER_NAME="file-upload-cluster-1"
SERVICE_NAME_SERVER="file-upload-server-service"
TASK_DEFINITION_SERVER="file-upload-server"

echo "Note: Client is now deployed via AWS Amplify"
echo "Deploying server only..."

# Update task definition
echo "Registering server task definition..."

aws ecs register-task-definition \
  --cli-input-json file://ecs/server-task-definition.json \
  --region $AWS_REGION

# Update service
echo "Updating ECS server service..."

aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_NAME_SERVER \
  --force-new-deployment \
  --region $AWS_REGION

echo "Server deployment initiated!"

