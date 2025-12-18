# GitHub Actions CI/CD Setup Guide

This guide walks you through setting up GitHub Actions to automatically deploy your application to AWS ECS after merging a PR to the main branch.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Create IAM User for GitHub Actions](#step-1-create-iam-user-for-github-actions)
4. [Step 2: Configure GitHub Secrets](#step-2-configure-github-secrets)
5. [Step 3: Update Workflow Configuration](#step-3-update-workflow-configuration)
6. [Step 4: Test the Workflow](#step-4-test-the-workflow)
7. [Troubleshooting](#troubleshooting)
8. [Security Best Practices](#security-best-practices)

---

## Overview

**What happens when you merge a PR to main:**
1. ✅ GitHub Actions workflow triggers automatically
2. ✅ Builds Docker images for server and client
3. ✅ Pushes images to Amazon ECR
4. ✅ Updates ECS task definitions with new images
5. ✅ Deploys to ECS services
6. ✅ Waits for services to stabilize
7. ✅ Verifies deployment status

**No manual steps required!** 🎉

---

## Prerequisites

Before starting, ensure you have:
- ✅ GitHub repository (public or private)
- ✅ AWS Account with existing ECS cluster and services
- ✅ ECR repositories created (`file-upload-server` and `file-upload-client`)
- ✅ AWS Console access

---

## Step 1: Create IAM User for GitHub Actions

### 1.1 Create IAM User

1. Go to **AWS Console** → **IAM** → **Users** → **Create user**

2. **User name:** `github-actions-deployer`
   - **Description:** IAM user for GitHub Actions CI/CD deployments

3. Click **Next**

### 1.2 Create Custom Policy

1. **IAM Console** → **Policies** → **Create policy**

2. Click **JSON** tab and paste the following policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "ECRAccess",
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "ecr:PutImage",
                "ecr:InitiateLayerUpload",
                "ecr:UploadLayerPart",
                "ecr:CompleteLayerUpload",
                "ecr:DescribeRepositories",
                "ecr:ListImages"
            ],
            "Resource": "*"
        },
        {
            "Sid": "ECSAccess",
            "Effect": "Allow",
            "Action": [
                "ecs:RegisterTaskDefinition",
                "ecs:DeregisterTaskDefinition",
                "ecs:DescribeTaskDefinition",
                "ecs:ListTaskDefinitions",
                "ecs:UpdateService",
                "ecs:DescribeServices",
                "ecs:ListServices",
                "ecs:ListTasks",
                "ecs:DescribeTasks"
            ],
            "Resource": "*"
        },
        {
            "Sid": "CloudWatchLogsAccess",
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams"
            ],
            "Resource": "*"
        },
        {
            "Sid": "IAMPassRole",
            "Effect": "Allow",
            "Action": [
                "iam:PassRole"
            ],
            "Resource": [
                "arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskExecutionRole",
                "arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskRole"
            ]
        },
        {
            "Sid": "STSGetCallerIdentity",
            "Effect": "Allow",
            "Action": [
                "sts:GetCallerIdentity"
            ],
            "Resource": "*"
        }
    ]
}
```

3. **Replace `YOUR_ACCOUNT_ID`** with your AWS account ID (e.g., `560629972528`)

4. Click **Next**

5. **Policy name:** `GitHubActionsDeployPolicy`
   - **Description:** Policy for GitHub Actions to deploy to ECS

6. Click **Create policy**

### 1.3 Attach Policy to User

1. Go back to **IAM** → **Users** → Select `github-actions-deployer`

2. Click **Add permissions** → **Attach policies directly**

3. Search for and select: `GitHubActionsDeployPolicy`

4. Click **Next** → **Add permissions**

### 1.4 Create Access Keys

1. Still in the user page, go to **Security credentials** tab

2. Click **Create access key**

3. **Use case:** **Application running outside AWS**

4. Click **Next** → **Create access key**

5. **⚠️ IMPORTANT: Copy both values now - you won't be able to see them again!**
   - **Access key ID:** (e.g., `AKIAIOSFODNN7EXAMPLE`)
   - **Secret access key:** (e.g., `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`)

6. Click **Download .csv file** (backup) or copy to a secure location

7. Click **Done**

---

## Step 2: Configure GitHub Secrets

### 2.1 Navigate to Repository Settings

1. Go to your **GitHub repository**
2. Click **Settings** (top menu)
3. In the left sidebar, click **Secrets and variables** → **Actions**

### 2.2 Add AWS Credentials

1. Click **New repository secret**

2. **Name:** `AWS_ACCESS_KEY_ID`
   - **Secret:** Paste your Access Key ID from Step 1.4
   - Click **Add secret**

3. Click **New repository secret** again

4. **Name:** `AWS_SECRET_ACCESS_KEY`
   - **Secret:** Paste your Secret Access Key from Step 1.4
   - Click **Add secret**

### 2.3 Verify Secrets

You should now see two secrets:
- ✅ `AWS_ACCESS_KEY_ID`
- ✅ `AWS_SECRET_ACCESS_KEY`

---

## Step 3: Update Workflow Configuration

### 3.1 Update ALB DNS (If Needed)

1. Open `.github/workflows/deploy.yml` in your repository

2. Find the `ALB_DNS` environment variable:

```yaml
ALB_DNS: file-upload-alb-209868263.eu-north-1.elb.amazonaws.com
```

3. Update with your actual ALB DNS name if different

4. Commit and push the change

### 3.2 Verify Workflow File Location

Ensure the workflow file is at:
```
.github/workflows/deploy.yml
```

The workflow is already configured to:
- ✅ Trigger on push to `main` branch
- ✅ Ignore markdown file changes (won't trigger on README updates)
- ✅ Build and push both server and client images
- ✅ Deploy to both ECS services
- ✅ Wait for service stability
- ✅ Verify deployment

---

## Step 4: Test the Workflow

### 4.1 Create a Test PR

1. Create a new branch:
   ```bash
   git checkout -b test-github-actions
   ```

2. Make a small change (e.g., update a comment or add a log statement)

3. Commit and push:
   ```bash
   git add .
   git commit -m "Test GitHub Actions workflow"
   git push origin test-github-actions
   ```

4. Create a Pull Request on GitHub

5. Merge the PR to `main` branch

### 4.2 Monitor the Workflow

1. Go to your **GitHub repository**

2. Click **Actions** tab (top menu)

3. You should see a workflow run: **"Deploy to AWS ECS"**

4. Click on the workflow run to see progress

5. Watch the steps:
   - ✅ Checkout code
   - ✅ Configure AWS credentials
   - ✅ Login to Amazon ECR
   - ✅ Build, tag, and push server image
   - ✅ Build, tag, and push client image
   - ✅ Update task definitions
   - ✅ Deploy to ECS
   - ✅ Verify deployment

### 4.3 Verify Deployment

1. **Check ECS Console:**
   - Go to **ECS** → **Clusters** → `file-upload-cluster-1`
   - **Services** → Check both services show new tasks running
   - **Events** tab → Verify deployment events

2. **Test Application:**
   - Visit your ALB URL or domain
   - Verify application is working with latest changes

### 4.4 View Workflow Logs

If the workflow fails:
1. Click on the failed workflow run
2. Click on the failed job
3. Expand the failed step to see error details
4. Check the troubleshooting section below

---

## Troubleshooting

### Issue 1: "Access Denied" or "UnauthorizedOperation"

**Symptoms:** Workflow fails with AWS permission errors

**Solutions:**
- Verify IAM user has the correct policy attached
- Check that secrets are correctly set in GitHub
- Ensure IAM policy includes all required permissions
- Verify account ID in IAM PassRole policy matches your account

### Issue 2: "CannotPullContainerError"

**Symptoms:** ECS tasks fail to start

**Solutions:**
- Verify Docker images were pushed to ECR successfully
- Check ECR repository names match workflow configuration
- Ensure task definition image paths are correct
- Verify ECS task execution role has ECR permissions

### Issue 3: "Service does not have a stable task definition"

**Symptoms:** Deployment times out

**Solutions:**
- Check CloudWatch logs for container errors
- Verify environment variables in task definition
- Ensure health checks are passing
- Check if tasks are stuck in PENDING state

### Issue 4: Workflow Not Triggering

**Symptoms:** No workflow runs appear after merging PR

**Solutions:**
- Verify workflow file is in `.github/workflows/` directory
- Check branch name is `main` (not `master`)
- Ensure workflow file has correct YAML syntax
- Check if changes are in `paths-ignore` list (e.g., only `.md` files changed)

### Issue 5: "Image not found" in ECR

**Symptoms:** ECR push fails or image not found

**Solutions:**
- Verify ECR repositories exist
- Check repository names match workflow configuration
- Ensure IAM user has ECR push permissions
- Verify AWS region is correct

### Issue 6: Client Build Fails

**Symptoms:** Client Docker build fails

**Solutions:**
- Verify `VITE_API_BASE_URL` is correctly set
- Check ALB DNS is correct
- Ensure build args are properly formatted
- Check client Dockerfile for issues

---

## Security Best Practices

### 1. Use Least Privilege IAM Policy

The provided policy only grants necessary permissions. Don't use `AdministratorAccess` or overly broad policies.

### 2. Rotate Access Keys Regularly

- **Recommended:** Rotate every 90 days
- Create new keys, update GitHub secrets, then delete old keys

### 3. Use OIDC Instead of Access Keys (Advanced)

For better security, use OpenID Connect (OIDC) to authenticate GitHub Actions without storing access keys:

1. **IAM** → **Identity providers** → **Add provider**
2. **Provider type:** OpenID Connect
3. **Provider URL:** `https://token.actions.githubusercontent.com`
4. **Audience:** `sts.amazonaws.com`
5. Update workflow to use OIDC instead of access keys

**Example OIDC workflow step:**
```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::ACCOUNT_ID:role/GitHubActionsRole
    aws-region: ${{ env.AWS_REGION }}
```

### 4. Restrict Workflow Permissions

Add to your workflow file:
```yaml
permissions:
  contents: read
  pull-requests: write  # Only if you need PR comments
```

### 5. Use Branch Protection Rules

1. **Repository Settings** → **Branches**
2. Add rule for `main` branch:
   - ✅ Require pull request reviews
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date

### 6. Monitor Access

- Regularly review IAM user access in CloudTrail
- Set up CloudWatch alarms for failed deployments
- Review GitHub Actions logs regularly

### 7. Use Environment Secrets (For Multiple Environments)

For staging/production separation:
1. **Settings** → **Environments** → **New environment**
2. Create `staging` and `production` environments
3. Add environment-specific secrets
4. Update workflow to use environments:

```yaml
jobs:
  deploy:
    environment: production
    runs-on: ubuntu-latest
    # ... rest of workflow
```

---

## Workflow Customization

### Add Notifications

Add Slack/Email notifications on deployment:

```yaml
- name: Notify on Success
  if: success()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Deployment successful!'
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Add Tests Before Deployment

```yaml
- name: Run Tests
  run: |
    cd server
    npm install
    npm test
    cd ../client
    npm install
    npm test
```

### Deploy Only on Tags

To deploy only when creating a release tag:

```yaml
on:
  push:
    tags:
      - 'v*'
```

### Manual Workflow Dispatch

Allow manual triggering:

```yaml
on:
  push:
    branches:
      - main
  workflow_dispatch:
```

Then you can trigger manually from **Actions** → **Run workflow**

---

## Quick Reference

**Workflow File:** `.github/workflows/deploy.yml`

**GitHub Secrets:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

**IAM User:** `github-actions-deployer`

**IAM Policy:** `GitHubActionsDeployPolicy`

**Workflow Triggers:**
- Push to `main` branch
- Ignores `.md` file changes

**View Workflows:** Repository → **Actions** tab

---

## Summary

You've successfully set up:
- ✅ GitHub Actions workflow for automated deployments
- ✅ IAM user with minimal required permissions
- ✅ GitHub secrets for secure credential storage
- ✅ Automated deployment on PR merge to main

**Your deployment is now fully automated!** 🎉

Every time you merge a PR to `main`:
1. Code is automatically built
2. Docker images are pushed to ECR
3. ECS services are updated
4. Deployment is verified

**No manual steps required!**

---

## Next Steps

1. ✅ **Add tests** - Run tests before deployment
2. ✅ **Add staging environment** - Deploy to staging first
3. ✅ **Add notifications** - Get notified on deployment status
4. ✅ **Add rollback** - Automatic rollback on failure
5. ✅ **Use OIDC** - More secure authentication (no access keys)
6. ✅ **Add deployment approvals** - Require approval for production

---

**Need Help?**
- Check workflow logs in **Actions** tab
- Review AWS CloudWatch logs for ECS tasks
- Verify IAM permissions in AWS Console
- Check GitHub Actions documentation: https://docs.github.com/en/actions

