import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is required');
  process.exit(1);
}

async function createIndexes() {
  const client = new MongoClient(MONGODB_URI!);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    // Extract database name from URI
    const uriParts = MONGODB_URI!.split('/');
    const dbName = uriParts[uriParts.length - 1]?.split('?')[0] || 'amgeljodi';
    const db = client.db(dbName);

    console.log(`Using database: ${dbName}`);

    // Create connections collection indexes
    console.log('\nCreating indexes for connections collection...');
    const connectionsCollection = db.collection('connections');

    // Unique index to prevent duplicate requests between same users
    await connectionsCollection.createIndex(
      { fromUserId: 1, toUserId: 1 },
      { unique: true, name: 'unique_connection_pair' }
    );
    console.log('  ✓ Created unique index: fromUserId + toUserId');

    // Index for fetching received requests
    await connectionsCollection.createIndex(
      { toUserId: 1, status: 1, updatedAt: -1 },
      { name: 'received_requests' }
    );
    console.log('  ✓ Created index: toUserId + status + updatedAt (received requests)');

    // Index for fetching sent requests
    await connectionsCollection.createIndex(
      { fromUserId: 1, status: 1, updatedAt: -1 },
      { name: 'sent_requests' }
    );
    console.log('  ✓ Created index: fromUserId + status + updatedAt (sent requests)');

    // Create notifications collection indexes
    console.log('\nCreating indexes for notifications collection...');
    const notificationsCollection = db.collection('notifications');

    // Index for fetching user's notifications
    await notificationsCollection.createIndex(
      { userId: 1, createdAt: -1 },
      { name: 'user_notifications' }
    );
    console.log('  ✓ Created index: userId + createdAt (user notifications)');

    // Index for counting unread notifications
    await notificationsCollection.createIndex(
      { userId: 1, read: 1 },
      { name: 'unread_notifications' }
    );
    console.log('  ✓ Created index: userId + read (unread count)');

    console.log('\n✅ All indexes created successfully!');
  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

createIndexes();
