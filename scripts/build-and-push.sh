#!/bin/bash

# Configuration
AWS_REGION="eu-north-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPOSITORY_SERVER="file-upload-server"

echo "AWS Account ID: $AWS_ACCOUNT_ID"
echo "Region: $AWS_REGION"
echo "Note: Client is now deployed via AWS Amplify"

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push server
echo "Building server image..."
cd server
docker build --platform linux/amd64 -t $ECR_REPOSITORY_SERVER:latest .
docker tag $ECR_REPOSITORY_SERVER:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_SERVER:latest

echo "Pushing server image to ECR..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_SERVER:latest

cd ..

echo "Server build and push completed!"

