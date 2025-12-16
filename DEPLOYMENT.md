# AWS ECS Fargate Deployment Guide

This guide walks you through deploying the file upload application to AWS ECS Fargate.

## Prerequisites

1. AWS CLI installed and configured
2. Docker installed
3. AWS account with appropriate permissions
4. ECR repositories created
5. ECS cluster created
6. VPC, subnets, and security groups configured

## Step 1: Create ECR Repositories

```bash
chmod +x scripts/create-ecr-repos.sh
./scripts/create-ecr-repos.sh
```

Or manually:
```bash
aws ecr create-repository --repository-name file-upload-server --region eu-north-1
aws ecr create-repository --repository-name file-upload-client --region eu-north-1
```

## Step 2: Create IAM Roles

You can use the provided script to create the roles automatically:

```bash
./scripts/create-iam-roles.sh
```

Or create them manually:

### Task Execution Role
Create an IAM role `ecsTaskExecutionRole` with:
- `AmazonECSTaskExecutionRolePolicy` (allows pulling images from ECR and writing logs to CloudWatch)

**Note:** This role is used by ECS to pull Docker images and write logs. It does NOT need S3 permissions.

### Task Role (ecsTaskRole)
This is the role that your application code will use. Create an IAM role `ecsTaskRole` with:

**Required Permissions:**
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
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:eu-north-1:*:*"
    }
  ]
}
```

**Important:** The AWS SDK will automatically use this role's credentials when running in ECS. No need to store credentials in Secrets Manager!

## Step 3: Create CloudWatch Log Groups

```bash
aws logs create-log-group --log-group-name /ecs/file-upload-server --region eu-north-1
aws logs create-log-group --log-group-name /ecs/file-upload-client --region eu-north-1
```

## Step 4: Update Task Definitions

Edit the task definition files in `ecs/`:
- Replace `YOUR_ACCOUNT_ID` with your AWS account ID
- Update `VITE_API_BASE_URL` in client task definition with your API domain
- Ensure `taskRoleArn` points to your `ecsTaskRole` (this provides S3 permissions)

## Step 5: Build and Push Docker Images

```bash
# Set API base URL for client build
export VITE_API_BASE_URL=https://your-api-domain.com/api

# Build and push
chmod +x scripts/build-and-push.sh
./scripts/build-and-push.sh
```

## Step 6: Create ECS Cluster

```bash
aws ecs create-cluster \
  --cluster-name file-upload-cluster \
  --region eu-north-1
```

## Step 7: Create ECS Services

### Server Service

```bash
aws ecs create-service \
  --cluster file-upload-cluster \
  --service-name file-upload-server-service \
  --task-definition file-upload-server \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --region eu-north-1
```

### Client Service

```bash
aws ecs create-service \
  --cluster file-upload-cluster \
  --service-name file-upload-client-service \
  --task-definition file-upload-client \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --region eu-north-1
```

## Step 8: Set Up Application Load Balancer (Recommended)

1. Create an Application Load Balancer
2. Create target groups for server (port 3001) and client (port 80)
3. Register ECS services with target groups
4. Configure listeners and routing rules

## Step 9: Deploy Updates

After initial setup, use the deployment script:

```bash
chmod +x scripts/deploy-ecs.sh
./scripts/deploy-ecs.sh
```

## Environment Variables

### Server
- `AWS_REGION`: eu-north-1
- `S3_BUCKET_NAME`: image-upload-just-life-things
- `PORT`: 3001
- **No credentials needed!** AWS SDK automatically uses the task's IAM role (`ecsTaskRole`)

### Client
- `VITE_API_BASE_URL`: Your API domain (e.g., https://api.yourdomain.com/api)

## Security Considerations

1. **Use IAM roles** - Never store credentials. The AWS SDK automatically uses the task's IAM role
2. **Least privilege** - Give IAM roles only the minimum required permissions
3. **Enable VPC** - Run tasks in private subnets when possible
4. **Use HTTPS** - Set up SSL/TLS certificates
5. **Enable CloudWatch** - Monitor logs and metrics
6. **Set up WAF** - Protect against common attacks
7. **Rotate credentials** - If you must use access keys for local dev, rotate them regularly

## Troubleshooting

### Check ECS Service Status
```bash
aws ecs describe-services \
  --cluster file-upload-cluster \
  --services file-upload-server-service \
  --region eu-north-1
```

### View Logs
```bash
aws logs tail /ecs/file-upload-server --follow --region eu-north-1
```

### Check Task Status
```bash
aws ecs list-tasks \
  --cluster file-upload-cluster \
  --service-name file-upload-server-service \
  --region eu-north-1
```

## Cost Optimization

- Use Fargate Spot for non-production workloads
- Set up auto-scaling based on CPU/memory
- Use CloudWatch alarms for monitoring
- Consider using ECS Service Connect for service discovery

