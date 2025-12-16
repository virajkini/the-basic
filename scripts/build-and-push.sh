#!/bin/bash

# Configuration
AWS_REGION="eu-north-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPOSITORY_SERVER="file-upload-server"
ECR_REPOSITORY_CLIENT="file-upload-client"

echo "AWS Account ID: $AWS_ACCOUNT_ID"
echo "Region: $AWS_REGION"

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

# Build and push client
echo "Building client image..."
cd client
docker build --platform linux/amd64 --build-arg VITE_API_BASE_URL=http://file-upload-alb-209868263.eu-north-1.elb.amazonaws.com/api -t $ECR_REPOSITORY_CLIENT:latest .
docker tag $ECR_REPOSITORY_CLIENT:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_CLIENT:latest

echo "Pushing client image to ECR..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_CLIENT:latest

cd ..

echo "Build and push completed!"

