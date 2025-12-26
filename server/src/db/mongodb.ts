import { MongoClient, Db, MongoClientOptions } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

// Connection options with increased timeouts and retry logic
const mongoOptions: MongoClientOptions = {
  serverSelectionTimeoutMS: 30000, // 30 seconds (default is 30s, but making explicit)
  connectTimeoutMS: 30000, // 30 seconds
  socketTimeoutMS: 45000, // 45 seconds
  maxPoolSize: 10,
  minPoolSize: 1,
  maxIdleTimeMS: 30000,
  retryWrites: true,
  retryReads: true,
  // SSL/TLS options
  tls: true,
  tlsAllowInvalidCertificates: false,
  tlsAllowInvalidHostnames: false,
};

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

function createMongoClient(): Promise<MongoClient> {
  console.log('🔄 Initializing MongoDB connection...');
  const mongoClient = new MongoClient(MONGODB_URI!, mongoOptions);
  
  return mongoClient.connect()
    .then((connectedClient) => {
      console.log('✅ MongoDB connection established successfully');
      return connectedClient;
    })
    .catch((error) => {
      console.error('❌ MongoDB connection failed:', error.message);
      console.error('Error details:', {
        name: error.name,
        code: error.code,
        message: error.message
      });
      throw error;
    });
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    clientPromise = createMongoClient();
    globalWithMongo._mongoClientPromise = clientPromise;
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  // Create connection lazily - don't block server startup
  clientPromise = createMongoClient();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;

// Helper function to get database instance
export async function getDatabase(dbName?: string): Promise<Db> {
  if (!clientPromise) {
    throw new Error('MongoDB client not initialized. MONGODB_URI environment variable is required.');
  }
  
  try {
    const client = await clientPromise;
    // Extract database name from URI or use provided/default
    if (dbName) {
      return client.db(dbName);
    }
    if (MONGODB_URI) {
      const uriParts = MONGODB_URI.split('/');
      const dbPart = uriParts[uriParts.length - 1]?.split('?')[0];
      if (dbPart) {
        return client.db(dbPart);
      }
    }
    return client.db('amgeljodi');
  } catch (error) {
    console.error('Error getting database:', error);
    throw error;
  }
}

