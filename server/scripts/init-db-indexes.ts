import { MongoClient, Collection } from 'mongodb';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is required');
  process.exit(1);
}

// Helper to create index, ignoring "already exists" errors
async function safeCreateIndex(
  collection: Collection,
  keys: Record<string, 1 | -1>,
  name: string
): Promise<boolean> {
  try {
    await collection.createIndex(keys, { name });
    return true;
  } catch (error: any) {
    // Index already exists (possibly with different name) - that's fine
    if (error.code === 85 || error.code === 86) {
      return false; // Already exists
    }
    throw error;
  }
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

    // Create profiles collection indexes
    console.log('\nCreating indexes for profiles collection...');
    const profilesCollection = db.collection('profiles');

    // Index for sorting by recently added
    if (await safeCreateIndex(profilesCollection, { createdAt: -1 }, 'created_at_sort')) {
      console.log('  ✓ Created index: createdAt (recently added sort)');
    } else {
      console.log('  ○ Index already exists: createdAt');
    }

    // Index for sorting by recently updated
    if (await safeCreateIndex(profilesCollection, { updatedAt: -1 }, 'updated_at_sort')) {
      console.log('  ✓ Created index: updatedAt (recently updated sort)');
    } else {
      console.log('  ○ Index already exists: updatedAt');
    }

    // Index for sorting by age (dob field - string YYYY-MM-DD)
    if (await safeCreateIndex(profilesCollection, { dob: 1 }, 'dob_sort')) {
      console.log('  ✓ Created index: dob (age sort)');
    } else {
      console.log('  ○ Index already exists: dob');
    }

    // Index for sorting by height
    if (await safeCreateIndex(profilesCollection, { heightCm: 1 }, 'height_sort')) {
      console.log('  ✓ Created index: heightCm (height sort)');
    } else {
      console.log('  ○ Index already exists: heightCm');
    }

    // Compound index for gender filter + sort by createdAt (common query pattern)
    if (await safeCreateIndex(profilesCollection, { gender: 1, createdAt: -1 }, 'gender_created_at')) {
      console.log('  ✓ Created index: gender + createdAt (filtered discovery)');
    } else {
      console.log('  ○ Index already exists: gender + createdAt');
    }

    // Index for name search (regex queries benefit from this for anchored patterns)
    if (await safeCreateIndex(profilesCollection, { firstName: 1 }, 'firstname_search')) {
      console.log('  ✓ Created index: firstName (name search)');
    } else {
      console.log('  ○ Index already exists: firstName');
    }

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
