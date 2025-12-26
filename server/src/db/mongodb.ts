import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is required');
}

// Create MongoDB client
const client = new MongoClient(MONGODB_URI);

// Connect to MongoDB
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development, use global to prevent multiple connections during hot reload
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production, just connect
  clientPromise = client.connect();
}

// Get database instance
export async function getDatabase(dbName?: string): Promise<Db> {
  const connectedClient = await clientPromise;
  
  if (dbName) {
    return connectedClient.db(dbName);
  }
  
  // Extract database name from URI or use default
  if (MONGODB_URI) {
    const uriParts = MONGODB_URI.split('/');
    const dbNameFromUri = uriParts[uriParts.length - 1]?.split('?')[0];
    if (dbNameFromUri) {
      return connectedClient.db(dbNameFromUri);
    }
  }
  
  return connectedClient.db('amgeljodi');
}

export default clientPromise;
