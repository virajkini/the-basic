# Complete AWS ECS Fargate Deployment Guide

This comprehensive guide documents the complete process of deploying a full-stack React + Express application to AWS ECS Fargate with Application Load Balancer.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [Files Created](#files-created)
4. [Step-by-Step Deployment Process](#step-by-step-deployment-process)
5. [Mapping Production Domain](#mapping-production-domain)
6. [Troubleshooting](#troubleshooting)

---

## Project Overview

**Application:** File Upload App with S3 Integration
- **Frontend:** React + TypeScript + Tailwind CSS (Vite)
- **Backend:** Express + TypeScript (Node.js)
- **Storage:** AWS S3
- **Infrastructure:** AWS ECS Fargate + Application Load Balancer
- **Region:** eu-north-1 (Stockholm)

---

## Architecture Overview

```
Internet
    ↓
[Application Load Balancer] (Public-facing)
    ├─ /api/* → [Server Service] (Port 3001)
    │              └─ Express API
    │                  └─ S3 (via IAM Role)
    │
    └─ /* → [Client Service] (Port 80)
              └─ Nginx serving React app
```

**Key Components:**
- **ALB:** Routes traffic based on path (`/api/*` vs everything else)
- **Server Service:** Handles API requests, generates S3 presigned URLs
- **Client Service:** Serves React static files via Nginx
- **IAM Roles:** Provide secure access to S3 without storing credentials
- **VPC:** Isolates network resources
- **Security Groups:** Control inbound/outbound traffic

---

## Files Created

### Docker Configuration

#### `server/Dockerfile`
**Purpose:** Multi-stage build for Express server
- **Build Stage:** Compiles TypeScript, installs dependencies
- **Production Stage:** Runs only production dependencies
- **Significance:** Reduces image size, improves security, faster deployments

#### `client/Dockerfile`
**Purpose:** Multi-stage build for React app
- **Build Stage:** Builds React app with Vite
- **Production Stage:** Serves static files via Nginx
- **Significance:** Optimized production build, efficient static file serving

#### `client/nginx.conf`
**Purpose:** Nginx configuration for React SPA
- **Features:** SPA routing, gzip compression, caching, security headers
- **Significance:** Handles client-side routing, improves performance

#### `server/.dockerignore` & `client/.dockerignore`
**Purpose:** Exclude unnecessary files from Docker builds
- **Significance:** Smaller images, faster builds

#### `docker-compose.yml`
**Purpose:** Local development with Docker
- **Significance:** Test Docker setup before deploying to AWS

### ECS Configuration

#### `ecs/server-task-definition.json`
**Purpose:** Blueprint for running server containers
- **Defines:** CPU, memory, image, ports, environment variables, IAM roles, logging
- **Significance:** Tells ECS how to run your server container

#### `ecs/client-task-definition.json`
**Purpose:** Blueprint for running client containers
- **Defines:** CPU, memory, image, ports, environment variables, IAM roles, logging
- **Significance:** Tells ECS how to run your client container

### Deployment Scripts

#### `scripts/build-and-push.sh`
**Purpose:** Builds Docker images and pushes to ECR
- **Steps:** Login to ECR, build images, tag, push
- **Significance:** Automates image deployment process

#### `scripts/deploy-ecs.sh`
**Purpose:** Registers task definitions and updates ECS services
- **Steps:** Register task definitions, force new deployments
- **Significance:** Automates ECS service updates

### Configuration Files

#### `client/vite-env.d.ts`
**Purpose:** TypeScript definitions for Vite environment variables
- **Significance:** Enables type-safe access to `import.meta.env`

---

## Step-by-Step Deployment Process

### Phase 1: AWS Infrastructure Setup

#### Step 1: Create VPC and Networking

**What:** Set up isolated network environment

**In AWS Console:**
1. VPC Dashboard → Create VPC
   - Name: `file-upload-vpc`
   - IPv4 CIDR: `10.0.0.0/16`
   - Create Internet Gateway and attach to VPC

2. Create 2 Public Subnets (different Availability Zones)
   - Subnet 1: `10.0.1.0/24` in `eu-north-1a`
   - Subnet 2: `10.0.2.0/24` in `eu-north-1b`
   - Enable auto-assign public IP

3. Configure Route Tables
   - Ensure route to Internet Gateway (`0.0.0.0/0` → IGW)
   - Associate both subnets with the route table

**Significance:**
- VPC provides network isolation
- Public subnets allow internet access (needed for ECR image pulls)
- Route tables enable internet connectivity

---

#### Step 2: Create Security Groups

**What:** Virtual firewalls controlling traffic

**In AWS Console:**
1. EC2 Dashboard → Security Groups → Create security group

2. **ALB Security Group** (`file-upload-alb-sg`)
   - Inbound: HTTP (80), HTTPS (443) from `0.0.0.0/0`
   - **Significance:** Allows public internet access to load balancer

3. **Server Security Group** (`file-upload-server-sg`)
   - Inbound: Port 3001 from ALB security group only
   - **Significance:** Server only accessible through ALB, not directly from internet

4. **Client Security Group** (`file-upload-client-sg`)
   - Inbound: Port 80 from ALB security group only
   - **Significance:** Client only accessible through ALB, not directly from internet

**Significance:**
- Defense in depth: Multiple layers of security
- Least privilege: Each component only accessible as needed
- ALB acts as single entry point

---

#### Step 3: Create IAM Roles

**What:** Define permissions for ECS tasks

**In AWS Console:**
1. IAM Dashboard → Roles → Create role

2. **Task Execution Role** (`ecsTaskExecutionRole`)
   - Trust: ECS Tasks
   - Policy: `AmazonECSTaskExecutionRolePolicy`
   - **Significance:** Allows ECS to pull Docker images from ECR and write logs to CloudWatch

3. **Task Role** (`ecsTaskRole`)
   - Trust: ECS Tasks
   - Custom Policy: S3 read/write permissions for your bucket
   - **Significance:** Your application code uses this role to access S3 (no credentials needed!)

**Significance:**
- No credentials stored anywhere
- AWS SDK automatically uses IAM role
- Follows AWS security best practices

---

#### Step 4: Create CloudWatch Log Groups

**What:** Centralized logging for containers

```bash
aws logs create-log-group --log-group-name /ecs/file-upload-server --region eu-north-1
aws logs create-log-group --log-group-name /ecs/file-upload-client --region eu-north-1
```

**Significance:**
- All container logs in one place
- Easy debugging and monitoring
- Retention policies for cost management

---

#### Step 5: Create ECR Repositories

**What:** Docker image registry

```bash
aws ecr create-repository --repository-name file-upload-server --region eu-north-1
aws ecr create-repository --repository-name file-upload-client --region eu-north-1
```

**Significance:**
- Stores Docker images
- Private registry (secure)
- Integrated with ECS for easy image pulls

---

#### Step 6: Create ECS Cluster

**What:** Container orchestration platform

```bash
aws ecs create-cluster --cluster-name file-upload-cluster-1 --region eu-north-1
```

**Note:** If you get an error about service-linked role, create it first:
```bash
aws iam create-service-linked-role --aws-service-name ecs.amazonaws.com
```

**Significance:**
- Manages container lifecycle
- Handles scaling, health checks, deployments
- Fargate = serverless (no EC2 instances to manage)

---

### Phase 2: Application Load Balancer Setup

#### Step 7: Create Application Load Balancer

**What:** Distributes traffic and provides single entry point

**In AWS Console:**
1. EC2 Dashboard → Load Balancers → Create Load Balancer
2. Select Application Load Balancer
3. Configure:
   - Name: `file-upload-alb`
   - Scheme: Internet-facing
   - IP address type: IPv4
   - VPC: Your VPC
   - Availability Zones: Select your 2 public subnets (different AZs)
   - Security Group: `file-upload-alb-sg`
   - Listener: HTTP on port 80
   - Default action: Create new target group (we'll configure this later)

4. Click Create and wait 2-3 minutes for it to become active
5. **Note the DNS name** (e.g., `file-upload-alb-209868263.eu-north-1.elb.amazonaws.com`)

**Significance:**
- Single DNS name for your application
- Path-based routing (`/api/*` vs everything else)
- Health checks and automatic failover
- SSL/TLS termination (when you add HTTPS)

---

#### Step 8: Create Target Groups

**What:** Define where ALB routes traffic

**In AWS Console:**
1. EC2 Dashboard → Target Groups → Create target group

2. **Server Target Group** (`file-upload-server-tg`)
   - Target type: IP addresses
   - Protocol: HTTP, Port: 3001
   - VPC: Your VPC
   - Health check:
     - Health check path: `/api/files`
     - Healthy threshold: 2
     - Unhealthy threshold: 3
     - Timeout: 5 seconds
     - Interval: 30 seconds
     - Success codes: 200
   - Click Create

3. **Client Target Group** (`file-upload-client-tg`)
   - Target type: IP addresses
   - Protocol: HTTP, Port: 80
   - VPC: Your VPC
   - Health check:
     - Health check path: `/`
     - Healthy threshold: 2
     - Unhealthy threshold: 3
     - Timeout: 5 seconds
     - Interval: 30 seconds
     - Success codes: 200
   - Click Create

**Significance:**
- ALB routes traffic to these target groups
- Health checks ensure only healthy containers receive traffic
- Automatic registration of ECS tasks

---

#### Step 9: Configure ALB Listener Rules

**What:** Define routing logic

**In AWS Console:**
1. EC2 Dashboard → Load Balancers → Select your ALB
2. Listeners tab → Select HTTP:80 listener
3. Click Add rule
4. **Rule 1 (Priority 100):**
   - Conditions: Path is `/api/*`
   - Actions: Forward to → `file-upload-server-tg`
   - Click Save changes

5. **Edit Default Rule:**
   - Actions: Forward to → `file-upload-client-tg`
   - Click Save changes

**Significance:**
- `/api/*` requests go to server
- Everything else goes to client (React app)
- Enables single domain for entire application

---

### Phase 3: Application Deployment

#### Step 10: Update Task Definitions

**What:** Configure container specifications

**Files to update:**

1. **`ecs/server-task-definition.json`**
   - Replace all instances of `YOUR_ACCOUNT_ID` with your AWS Account ID (e.g., `560629972528`)
   - Verify `executionRoleArn` and `taskRoleArn` match your IAM roles

2. **`ecs/client-task-definition.json`**
   - Replace all instances of `YOUR_ACCOUNT_ID` with your AWS Account ID
   - Update `VITE_API_BASE_URL` with your ALB DNS name:
     ```json
     "value": "http://file-upload-alb-209868263.eu-north-1.elb.amazonaws.com/api"
     ```

**Significance:**
- Task definitions are blueprints for containers
- Define resources, environment, networking
- Versioned (revisions) for rollback capability

---

#### Step 11: Build and Push Docker Images

**What:** Package application into Docker images

**Important:** Ensure your build script uses `--platform linux/amd64` for Fargate compatibility.

```bash
# Set API base URL (use your ALB DNS name)
export VITE_API_BASE_URL=http://file-upload-alb-209868263.eu-north-1.elb.amazonaws.com/api

# Build and push
chmod +x scripts/build-and-push.sh
./scripts/build-and-push.sh
```

**What the script does:**
1. Logs into ECR using AWS credentials
2. Builds server image with `--platform linux/amd64` (required for Fargate)
3. Builds client image with API URL baked in at build time (Vite requirement)
4. Tags both images with ECR repository URLs
5. Pushes both images to ECR

**Significance:**
- Images are immutable and versioned
- `--platform linux/amd64` ensures compatibility with Fargate (not ARM64)
- Client image has API URL embedded (Vite requires build-time env vars)
- Images stored in private ECR registry

---

#### Step 12: Register Task Definitions

**What:** Upload container blueprints to ECS

```bash
aws ecs register-task-definition --cli-input-json file://ecs/server-task-definition.json --region eu-north-1

aws ecs register-task-definition --cli-input-json file://ecs/client-task-definition.json --region eu-north-1
```

**What happens:**
- ECS validates the task definition
- Creates a new revision (e.g., `file-upload-server:1`, `:2`, `:3`)
- Makes it available for services to use

**Significance:**
- Makes task definitions available to ECS
- Creates revision numbers for versioning
- Enables rollback to previous revisions if needed

---

#### Step 13: Create ECS Services

**What:** Deploy and manage containers

**Gather required information:**
- VPC ID: `vpc-0441b0f403673b9d4`
- Subnet IDs: `subnet-0a9f3c98b5389be56,subnet-0caa0954de80ffd8f`
- Server Security Group: `sg-03551970922923f7a`
- Client Security Group: `sg-09a551b7257434947`
- Target Group ARNs: Get from Target Groups in console

**Server Service:**
```bash
aws ecs create-service \
  --cluster file-upload-cluster-1 \
  --service-name file-upload-server-service \
  --task-definition file-upload-server:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-0a9f3c98b5389be56,subnet-0caa0954de80ffd8f],securityGroups=[sg-03551970922923f7a],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=YOUR_SERVER_TG_ARN,containerName=file-upload-server,containerPort=3001" \
  --region eu-north-1
```

**Client Service:**
```bash
aws ecs create-service \
  --cluster file-upload-cluster-1 \
  --service-name file-upload-client-service \
  --task-definition file-upload-client:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-0a9f3c98b5389be56,subnet-0caa0954de80ffd8f],securityGroups=[sg-09a551b7257434947],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=YOUR_CLIENT_TG_ARN,containerName=file-upload-client,containerPort=80" \
  --region eu-north-1
```

**Significance:**
- Services maintain desired number of running tasks
- Automatic restarts on failure
- Rolling updates for zero-downtime deployments
- Integration with ALB for traffic distribution
- Health checks ensure only healthy tasks receive traffic

---

## Mapping Production Domain

### Step 1: Get SSL Certificate (HTTPS)

**In AWS Console:**
1. Certificate Manager → Request certificate
2. Request public certificate
3. Domain name: 
   - `yourdomain.com` (root domain)
   - `*.yourdomain.com` (wildcard for subdomains)
4. Validation method: DNS validation (recommended)
5. Add CNAME records to your DNS provider as shown in ACM
6. Wait for validation (usually 5-10 minutes)
7. Status will change to "Issued" when validated

**Significance:**
- Enables HTTPS (secure, encrypted connections)
- Required for production applications
- Free SSL certificates via AWS Certificate Manager
- Automatic renewal

---

### Step 2: Update ALB Listener for HTTPS

**In AWS Console:**
1. EC2 Dashboard → Load Balancers → Select your ALB
2. Listeners tab → Add listener
3. Configure:
   - Protocol: HTTPS
   - Port: 443
   - Default SSL certificate: Select your ACM certificate
   - Default action: Forward to → `file-upload-client-tg`
4. Click Save
5. Add rule for API:
   - Priority: 100
   - Conditions: Path is `/api/*`
   - Actions: Forward to → `file-upload-server-tg`
   - Click Save changes

**Optional: Redirect HTTP to HTTPS**
1. Edit HTTP:80 listener
2. Default action: Redirect to HTTPS
3. Save changes

**Significance:**
- Encrypts all traffic between users and your application
- Builds user trust and improves SEO
- Required for many modern web features (service workers, etc.)
- Prevents man-in-the-middle attacks

---

### Step 3: Create Route 53 Hosted Zone (if using Route 53)

**In AWS Console:**
1. Route 53 Dashboard → Hosted zones → Create hosted zone
2. Domain name: `yourdomain.com`
3. Type: Public hosted zone
4. Click Create hosted zone

**Significance:**
- Manages DNS for your domain
- Integrated with AWS services
- Easy ALB integration via alias records
- Automatic health checks

---

### Step 4: Create DNS Records

**Option A: Using Route 53 (Recommended)**

1. Route 53 → Hosted zones → `yourdomain.com` → Create record
2. **A Record for root domain:**
   - Record name: `@` (or leave blank)
   - Record type: A
   - Alias: Yes
   - Route traffic to: Alias to Application Load Balancer
   - Region: eu-north-1
   - Load balancer: Select your ALB
   - Record routing policy: Simple routing
   - Click Create records

3. **A Record for www subdomain:**
   - Record name: `www`
   - Same configuration as above
   - Click Create records

**Option B: Using External DNS Provider**

1. Go to your DNS provider (GoDaddy, Namecheap, Cloudflare, etc.)
2. Find DNS management / DNS records section
3. Create A Record:
   - Name: `@` (or your subdomain like `app`)
   - Type: A (or CNAME if A not supported)
   - Value: Your ALB DNS name (e.g., `file-upload-alb-209868263.eu-north-1.elb.amazonaws.com`)
   - TTL: 300 (or default)
   - Save

4. **For www subdomain:**
   - Name: `www`
   - Type: CNAME
   - Value: `yourdomain.com` (or ALB DNS name)
   - Save

**Significance:**
- Maps your domain to the load balancer
- Users access via `yourdomain.com` instead of ALB DNS name
- Professional and memorable URL
- Better branding and SEO

---

### Step 5: Update Client Build with Production Domain

**Update `scripts/build-and-push.sh` line 30:**

```bash
docker build --platform linux/amd64 --build-arg VITE_API_BASE_URL=https://yourdomain.com/api -t $ECR_REPOSITORY_CLIENT:latest .
```

**Or use environment variable:**

```bash
export VITE_API_BASE_URL=https://yourdomain.com/api
./scripts/build-and-push.sh
```

**Then rebuild and redeploy:**

```bash
# Rebuild and push with new domain
./scripts/build-and-push.sh

# Force new deployment
aws ecs update-service --cluster file-upload-cluster-1 --service file-upload-client-service --force-new-deployment --region eu-north-1
```

**Significance:**
- Client app uses production domain for API calls
- Consistent URLs across environments
- HTTPS enabled for security
- API calls go to `https://yourdomain.com/api` instead of ALB DNS

---

### Step 6: Verify Domain Mapping

**Test DNS Resolution:**
```bash
# Check if DNS is resolving
nslookup yourdomain.com
dig yourdomain.com

# Should return your ALB IP addresses
```

**Test Application:**
1. Wait 5-10 minutes for DNS propagation
2. Visit `https://yourdomain.com` in browser
3. Check browser console (F12) for API calls
4. Verify API calls go to `https://yourdomain.com/api`
5. Test file upload functionality
6. Verify SSL certificate (green lock in browser)

**Significance:**
- Confirms domain is correctly mapped
- Verifies HTTPS is working
- Ensures application functions correctly with custom domain

---

## Complete File Structure

```
project-2026/
├── client/                          # React frontend
│   ├── Dockerfile                   # Multi-stage build for React app
│   ├── nginx.conf                   # Nginx config for SPA routing
│   ├── .dockerignore               # Exclude files from Docker build
│   ├── package.json                 # Frontend dependencies
│   ├── vite.config.ts              # Vite configuration
│   ├── tailwind.config.js          # Tailwind CSS config
│   ├── postcss.config.js           # PostCSS config
│   ├── tsconfig.json               # TypeScript config
│   ├── tsconfig.node.json          # TypeScript config for Node
│   └── src/
│       ├── App.tsx                  # Main app component
│       ├── main.tsx                 # React entry point
│       ├── index.css                # Tailwind CSS imports
│       ├── vite-env.d.ts           # Vite env types
│       └── components/
│           ├── FileUpload.tsx       # File upload component
│           └── AssetList.tsx        # Asset list component
│
├── server/                          # Express backend
│   ├── Dockerfile                   # Multi-stage build for Express
│   ├── .dockerignore               # Exclude files from Docker build
│   ├── package.json                 # Backend dependencies
│   ├── tsconfig.json               # TypeScript config
│   └── src/
│       └── index.ts                 # Express server with S3 integration
│
├── ecs/                             # ECS configuration
│   ├── server-task-definition.json  # Server container blueprint
│   └── client-task-definition.json # Client container blueprint
│
├── scripts/                         # Deployment automation
│   ├── build-and-push.sh           # Build and push Docker images
│   └── deploy-ecs.sh               # Deploy to ECS
│
├── docker-compose.yml              # Local Docker testing
├── package.json                    # Root package.json
├── .gitignore                      # Git ignore rules
├── README.md                       # Project overview
├── DEPLOYMENT.md                   # Quick deployment reference
└── COMPLETE_DEPLOYMENT_GUIDE.md   # This comprehensive guide
```

---

## Key Concepts Explained

### Docker Multi-Stage Builds
- **Why:** Reduces final image size by excluding build tools and dependencies
- **How:** Build stage compiles code, production stage only includes runtime
- **Benefit:** Faster deployments, smaller attack surface, lower storage costs

### Task Definitions
- **What:** Blueprints for containers (similar to Helm charts for Kubernetes)
- **Contains:** Image, CPU, memory, ports, environment variables, IAM roles, logging
- **Versioned:** Each registration creates a new revision (enables rollback)
- **Significance:** Defines "what" to run, not "how many" (that's the service)

### ECS Services
- **What:** Manages running containers based on task definitions
- **Features:** Auto-scaling, health checks, rolling updates, load balancer integration
- **Maintains:** Desired number of running tasks (auto-restarts on failure)
- **Significance:** Handles "how many" and "where" to run containers

### Application Load Balancer
- **What:** Distributes traffic across multiple targets
- **Features:** Path-based routing, SSL termination, health checks, sticky sessions
- **Benefit:** Single entry point, high availability, automatic failover
- **Significance:** Routes `/api/*` to server, everything else to client

### IAM Roles
- **Task Execution Role:** For ECS to pull images from ECR and write logs to CloudWatch
- **Task Role:** For your application code to access AWS services (S3) - no credentials needed!
- **Benefit:** No credentials stored, automatic credential rotation, follows least privilege

### Security Groups
- **What:** Virtual firewalls at instance/container level
- **ALB SG:** Public-facing, accepts internet traffic (ports 80, 443)
- **Service SGs:** Private, only accept traffic from ALB security group
- **Benefit:** Defense in depth, least privilege access, network-level security

### VPC and Networking
- **VPC:** Isolated network environment
- **Public Subnets:** Have route to Internet Gateway (needed for ECR image pulls)
- **Route Tables:** Define how traffic flows (public vs private)
- **Significance:** Network isolation, controlled internet access

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Cannot Pull Container Error
**Symptom:** `CannotPullContainerError: pull image manifest has been retried 7 time(s): image Manifest does not contain descriptor matching platform 'linux/amd64'`

**Cause:** Image built for wrong architecture (ARM64/Apple Silicon vs AMD64)

**Fix:** 
- Rebuild with `--platform linux/amd64` flag
- Update `scripts/build-and-push.sh` to include this flag

---

#### 2. ResourceInitializationError
**Symptom:** `unable to pull secrets or registry auth: There is a connection issue between the task and Amazon ECR`

**Cause:** Network connectivity issue - subnets not public, no internet gateway route, or security groups blocking outbound HTTPS

**Fix:**
- Ensure subnets have route to Internet Gateway (`0.0.0.0/0` → IGW)
- Verify security groups allow outbound HTTPS (port 443)
- Check route table associations with subnets

---

#### 3. Health Check Failures
**Symptom:** Tasks showing unhealthy, service deactivating tasks

**Cause:** Container health check using tools not installed (e.g., `curl` not in Alpine image)

**Fix:**
- Remove container health check from task definition (rely on target group health checks)
- Or install required tools in Dockerfile (e.g., `RUN apk add --no-cache curl`)

---

#### 4. API URL Errors
**Symptom:** `URL scheme "value" is not supported` or `Fetch API cannot load value:http://...`

**Cause:** Build arg syntax error - `--build-arg VITE_API_BASE_URL="value":"http://..."` instead of `--build-arg VITE_API_BASE_URL=http://...`

**Fix:**
- Remove `"value":` from build script
- Correct format: `--build-arg VITE_API_BASE_URL=http://your-domain.com/api`

---

#### 5. CORS Errors
**Symptom:** `Access to XMLHttpRequest has been blocked by CORS policy`

**Cause:** S3 bucket CORS not configured

**Fix:**
- S3 Dashboard → Your bucket → Permissions → CORS
- Add CORS configuration allowing your domain

---

#### 6. Task Stuck in PENDING
**Symptom:** Tasks remain in PENDING state, never start

**Cause:** Insufficient resources, network issues, or IAM permission problems

**Fix:**
- Check CloudWatch logs for errors
- Verify IAM roles have correct permissions
- Check if subnets have available IP addresses
- Verify security groups allow necessary traffic

---

## Cost Optimization Tips

1. **Use Fargate Spot** for non-production workloads (up to 70% savings)
2. **Right-size resources:** Start with 256 CPU / 512 MB, scale as needed
3. **Auto-scaling:** Scale down during low traffic periods
4. **CloudWatch Logs retention:** Set retention policies (default: never expire = higher costs)
5. **ALB:** Consider using NLB if you don't need path-based routing (slightly cheaper)
6. **S3:** Use lifecycle policies to move old files to cheaper storage classes (Glacier, etc.)
7. **Idle resources:** Stop services when not in use (dev/staging environments)

---

## Security Best Practices

1. ✅ **IAM Roles** - No credentials stored, automatic rotation
2. ✅ **Security Groups** - Least privilege access (only ALB can reach services)
3. ✅ **VPC** - Network isolation
4. ✅ **HTTPS** - Encrypted traffic (via ACM)
5. ✅ **CloudWatch** - Monitoring and alerting
6. ⚠️ **WAF** - Consider adding for DDoS protection
7. ⚠️ **Private Subnets** - Move tasks to private subnets with NAT Gateway (more secure, higher cost)
8. ⚠️ **Secrets Manager** - Use for sensitive data (if needed in future)
9. ⚠️ **VPC Endpoints** - For private ECR access (eliminates internet gateway need)

---

## Monitoring and Maintenance

### View Logs
```bash
# Server logs (real-time)
aws logs tail /ecs/file-upload-server --follow --region eu-north-1

# Client logs (real-time)
aws logs tail /ecs/file-upload-client --follow --region eu-north-1

# Recent logs (last 10 minutes)
aws logs tail /ecs/file-upload-server --since 10m --region eu-north-1
```

### Check Service Status
```bash
aws ecs describe-services \
  --cluster file-upload-cluster-1 \
  --services file-upload-server-service file-upload-client-service \
  --region eu-north-1 \
  --query "services[*].[serviceName,status,runningCount,desiredCount]" \
  --output table
```

### Check Task Status
```bash
# List running tasks
aws ecs list-tasks --cluster file-upload-cluster-1 --service-name file-upload-server-service --region eu-north-1

# Get task details
aws ecs describe-tasks --cluster file-upload-cluster-1 --tasks TASK_ARN --region eu-north-1
```

### Update Application
```bash
# 1. Make code changes locally
# 2. Rebuild and push images
./scripts/build-and-push.sh

# 3. Force new deployment (pulls latest images)
aws ecs update-service --cluster file-upload-cluster-1 --service file-upload-server-service --force-new-deployment --region eu-north-1
aws ecs update-service --cluster file-upload-cluster-1 --service file-upload-client-service --force-new-deployment --region eu-north-1
```

---

## Summary

You've successfully deployed a production-ready full-stack application to AWS with:

- ✅ **Containerized** applications (Docker)
- ✅ **Orchestrated** with ECS Fargate (serverless, no EC2 management)
- ✅ **Load balanced** with ALB (high availability, path-based routing)
- ✅ **Secured** with IAM roles (no credentials stored)
- ✅ **Monitored** with CloudWatch (centralized logging)
- ✅ **Scalable** architecture (easy to scale up/down)
- ✅ **Production-ready** with domain mapping and HTTPS support
- ✅ **Network isolated** with VPC and security groups

**Next Steps:**
- Set up auto-scaling based on CPU/memory usage
- Configure CloudWatch alarms for monitoring
- Set up CI/CD pipeline (GitHub Actions, AWS CodePipeline)
- Add monitoring dashboards (CloudWatch Dashboards)
- Implement backup strategies for S3
- Set up staging environment
- Add performance monitoring (X-Ray, etc.)

---

## Quick Reference

**Current Configuration:**
- **ALB DNS:** `file-upload-alb-209868263.eu-north-1.elb.amazonaws.com`
- **Cluster:** `file-upload-cluster-1`
- **Server Service:** `file-upload-server-service`
- **Client Service:** `file-upload-client-service`
- **S3 Bucket:** `image-upload-just-life-things`
- **Region:** `eu-north-1`
- **VPC:** `vpc-0441b0f403673b9d4`
- **Subnets:** `subnet-0a9f3c98b5389be56`, `subnet-0caa0954de80ffd8f`

**Useful Commands:**
```bash
# View logs
aws logs tail /ecs/file-upload-server --follow --region eu-north-1

# Check service status
aws ecs describe-services --cluster file-upload-cluster-1 --services file-upload-server-service --region eu-north-1

# Force deployment
aws ecs update-service --cluster file-upload-cluster-1 --service file-upload-server-service --force-new-deployment --region eu-north-1

# List tasks
aws ecs list-tasks --cluster file-upload-cluster-1 --service-name file-upload-server-service --region eu-north-1
```

---

**Congratulations!** 🎉 Your application is now running in production on AWS!

This deployment follows AWS best practices and provides a solid foundation for scaling and maintaining your application.

