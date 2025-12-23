import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import authRoutes from './routes/auth.js';
import { authenticateToken } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize S3 client
// In ECS/Fargate, credentials are automatically provided via IAM role
// For local development, use .env file or explicit credentials
const s3ClientConfig: {
  region: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
} = {
  region: process.env.AWS_REGION || 'eu-north-1',
};

// Only use explicit credentials if provided (for local development)
// In ECS, the SDK will automatically use the task's IAM role
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3ClientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

const s3Client = new S3Client(s3ClientConfig);

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'image-upload-just-life-things';

// Debug middleware to check CLIENT_URL environment variable
app.use((req, res, next) => {
  res.setHeader('X-Debug-Origin', process.env.CLIENT_URL || 'NOT_SET');
  next();
});

// CORS configuration - must specify exact origin when using credentials
const allowedOrigins = [
  'https://www.amgeljodi.com',
  'https://amgeljodi.com/',
  process.env.CLIENT_URL,
  'http://localhost:3000' // For local development
].filter(Boolean); // Remove any undefined/null values

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if the origin is in the allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Required for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(express.json());
app.use(cookieParser());

// Health check endpoint (no authentication required)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Auth routes (no authentication required)
app.use('/api/auth', authRoutes);

// Apply authentication middleware to all other API routes (excluding /api/auth and /health)
app.use((req, res, next) => {
  // Skip authentication for auth routes and health check
  if (req.path.startsWith('/api/auth') || req.path === '/health') {
    return next();
  }
  // Apply authentication for all other /api routes
  if (req.path.startsWith('/api')) {
    return authenticateToken(req, res, next);
  }
  next();
});

// Presigned URL endpoint
app.get('/api/presign', async (req, res) => {
  try {
    const { filename, contentType } = req.query;

    if (!filename || !contentType) {
      return res.status(400).json({ error: 'filename and contentType are required' });
    }

    // Generate a unique key for the file
    const key = `travel/${Date.now()}-${filename}`;

    // Generate presigned URL for PUT operation
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType as string,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    res.json({ url, key });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({ 
      error: 'Failed to generate presigned URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// List all uploaded files
app.get('/api/files', async (req, res) => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'travel/', // Only list files in the travel folder
    });

    const response = await s3Client.send(command);
    
    // Generate presigned URLs for each file
    const files = await Promise.all(
      (response.Contents || []).map(async (item) => {
        if (!item.Key) return null;
        
        // Generate presigned URL for GET operation (viewing the file)
        const getCommand = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: item.Key,
        });
        
        const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
        
        return {
          key: item.Key,
          url: url,
          size: item.Size,
          lastModified: item.LastModified,
        };
      })
    );

    // Filter out any null values
    const validFiles = files.filter((file): file is NonNullable<typeof file> => file !== null);

    res.json({ files: validFiles });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ 
      error: 'Failed to list files',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete a file
app.delete('/api/files/:key', async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key);

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);

    res.json({ message: 'File deleted successfully', key });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ 
      error: 'Failed to delete file',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

