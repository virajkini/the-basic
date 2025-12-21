import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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

// CORS configuration
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

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

