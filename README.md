# File Upload App

A simple React + TypeScript file upload application with an Express backend.

## Features

- React frontend with TypeScript
- Tailwind CSS for styling
- Express backend server
- File upload with progress tracking
- Presigned URL support for S3 uploads

## Setup

1. Install all dependencies:
```bash
npm run install:all
```

2. Start development servers (both frontend and backend):
```bash
npm run dev
```

Or start them separately:
```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend
npm run dev:client
```

## Configuration

### Backend (S3 Presigned URLs)

The server is configured to use AWS S3 with presigned URLs. Credentials are set as defaults in the code, but you can optionally create a `.env` file in the `server/` directory:

```bash
cd server
cat > .env << EOF
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
AWS_REGION=eu-north-1
S3_BUCKET_NAME=image-upload-just-life-things
EOF
```

**Note:** The `.env` file is already in `.gitignore` to keep credentials secure. The server will use the values from `.env` if present, otherwise it will use the defaults configured in the code.

## Project Structure

```
project-2026/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── FileUpload.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   └── package.json
├── server/          # Express backend
│   ├── src/
│   │   └── index.ts
│   └── package.json
└── package.json     # Root package.json
```

## Development

- Frontend runs on: http://localhost:3000
- Backend runs on: http://localhost:3001

## Docker

### Local Development with Docker

```bash
# Build and run with docker-compose
docker-compose up --build

# Or run individually
cd server && docker build -t file-upload-server . && docker run -p 3001:3001 file-upload-server
cd client && docker build -t file-upload-client . && docker run -p 3000:80 file-upload-client
```

## AWS ECS Fargate Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on deploying to AWS ECS Fargate.

Quick deployment steps:
1. Create ECR repositories: `./scripts/create-ecr-repos.sh`
2. Build and push images: `./scripts/build-and-push.sh`
3. Deploy to ECS: `./scripts/deploy-ecs.sh`

