# Quick Start Guide - AWS ECS Fargate Deployment

## Prerequisites Checklist

- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Docker installed and running
- [ ] AWS account with permissions for ECS, ECR, IAM, Secrets Manager
- [ ] VPC with public subnets and security groups configured

## Quick Deployment Steps

### 1. Get Your AWS Account ID
```bash
aws sts get-caller-identity --query Account --output text
```

### 2. Update Task Definitions
Edit `ecs/server-task-definition.json` and `ecs/client-task-definition.json`:
- Replace all `YOUR_ACCOUNT_ID` with your actual AWS account ID
- Update `VITE_API_BASE_URL` in client task definition with your API domain

### 3. Create ECR Repositories
```bash
./scripts/create-ecr-repos.sh
```

### 4. Create IAM Roles

**Quick setup with script:**
```bash
./scripts/create-iam-roles.sh
```

**Or create manually:**

**Task Execution Role (`ecsTaskExecutionRole`):**
- Attach managed policy: `AmazonECSTaskExecutionRolePolicy`
- Used by ECS to pull images and write logs

**Task Role (`ecsTaskRole`):**
- This is what your application code uses
- Attach custom policy with S3 permissions:
  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ],
        "Resource": [
          "arn:aws:s3:::image-upload-just-life-things",
          "arn:aws:s3:::image-upload-just-life-things/*"
        ]
      }
    ]
  }
  ```

**Note:** No Secrets Manager needed! AWS SDK automatically uses the task's IAM role.

### 5. Create CloudWatch Log Groups
```bash
aws logs create-log-group --log-group-name /ecs/file-upload-server --region eu-north-1
aws logs create-log-group --log-group-name /ecs/file-upload-client --region eu-north-1
```

### 6. Build and Push Images
```bash
export VITE_API_BASE_URL=https://your-api-domain.com/api
./scripts/build-and-push.sh
```

### 7. Create ECS Cluster
```bash
aws ecs create-cluster --cluster-name file-upload-cluster --region eu-north-1
```

### 8. Register Task Definitions
```bash
aws ecs register-task-definition --cli-input-json file://ecs/server-task-definition.json --region eu-north-1
aws ecs register-task-definition --cli-input-json file://ecs/client-task-definition.json --region eu-north-1
```

### 9. Create ECS Services
Replace `subnet-xxx`, `subnet-yyy`, and `sg-xxx` with your actual values:

```bash
# Server Service
aws ecs create-service \
  --cluster file-upload-cluster \
  --service-name file-upload-server-service \
  --task-definition file-upload-server:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --region eu-north-1

# Client Service
aws ecs create-service \
  --cluster file-upload-cluster \
  --service-name file-upload-client-service \
  --task-definition file-upload-client:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --region eu-north-1
```

## Testing Locally with Docker

```bash
# Set environment variables
export AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY

# Build and run
docker-compose up --build
```

Access:
- Client: http://localhost:3000
- Server: http://localhost:3001

## Updating Deployment

After making changes:

```bash
# Rebuild and push
./scripts/build-and-push.sh

# Deploy updates
./scripts/deploy-ecs.sh
```

## Troubleshooting

### View Logs
```bash
aws logs tail /ecs/file-upload-server --follow --region eu-north-1
aws logs tail /ecs/file-upload-client --follow --region eu-north-1
```

### Check Service Status
```bash
aws ecs describe-services \
  --cluster file-upload-cluster \
  --services file-upload-server-service file-upload-client-service \
  --region eu-north-1
```

### List Running Tasks
```bash
aws ecs list-tasks --cluster file-upload-cluster --region eu-north-1
```

