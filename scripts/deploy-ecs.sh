#!/bin/bash

# Configuration
AWS_REGION="eu-north-1"
CLUSTER_NAME="file-upload-cluster"
SERVICE_NAME_SERVER="file-upload-server-service"
SERVICE_NAME_CLIENT="file-upload-client-service"
TASK_DEFINITION_SERVER="file-upload-server"
TASK_DEFINITION_CLIENT="file-upload-client"

# Update task definitions
echo "Registering task definitions..."

aws ecs register-task-definition \
  --cli-input-json file://ecs/server-task-definition.json \
  --region $AWS_REGION

aws ecs register-task-definition \
  --cli-input-json file://ecs/client-task-definition.json \
  --region $AWS_REGION

# Update services
echo "Updating ECS services..."

aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_NAME_SERVER \
  --force-new-deployment \
  --region $AWS_REGION

aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_NAME_CLIENT \
  --force-new-deployment \
  --region $AWS_REGION

echo "Deployment initiated!"

