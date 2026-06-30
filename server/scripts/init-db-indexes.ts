import { MongoClient, Collection } from 'mongodb';
import * as dotenv from 'dotenv';
import { MONGODB_DB_NAME, APP_ENV } from '../src/config/appEnv.js';

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
  name: string,
  options: Record<string, unknown> = {}
): Promise<boolean> {
  try {
    await collection.createIndex(keys, { name, ...options });
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
    const db = client.db(MONGODB_DB_NAME);

    console.log(`Using app env: ${APP_ENV}`);
    console.log(`Using database: ${MONGODB_DB_NAME}`);

    const requiredCollections = [
      'users',
      'profiles',
      'connections',
      'notifications',
      'connection_quotas',
      'contact_messages',
    ];

    const existingCollections = new Set((await db.listCollections().toArray()).map((item) => item.name));
    for (const name of requiredCollections) {
      if (!existingCollections.has(name)) {
        await db.createCollection(name);
        console.log(`Created collection: ${name}`);
      }
    }

    console.log('\nCreating indexes for users collection...');
    const usersCollection = db.collection('users');
    if (await safeCreateIndex(usersCollection, { phone: 1 }, 'unique_user_phone')) {
      console.log('  ✓ Created unique index: phone');
    } else {
      console.log('  ○ Index already exists: phone');
    }
    if (await safeCreateIndex(usersCollection, { createdAt: -1 }, 'users_created_at')) {
      console.log('  ✓ Created index: createdAt');
    } else {
      console.log('  ○ Index already exists: createdAt');
    }

    // Create connections collection indexes
    console.log('\nCreating indexes for connections collection...');
    const connectionsCollection = db.collection('connections');

    if (await safeCreateIndex(connectionsCollection, { fromUserId: 1, toUserId: 1 }, 'unique_connection_pair')) {
      console.log('  ✓ Created unique index: fromUserId + toUserId');
    } else {
      console.log('  ○ Index already exists: fromUserId + toUserId');
    }
    if (await safeCreateIndex(connectionsCollection, { toUserId: 1, status: 1, updatedAt: -1 }, 'received_requests')) {
      console.log('  ✓ Created index: toUserId + status + updatedAt (received requests)');
    } else {
      console.log('  ○ Index already exists: received_requests');
    }
    if (await safeCreateIndex(connectionsCollection, { fromUserId: 1, status: 1, updatedAt: -1 }, 'sent_requests')) {
      console.log('  ✓ Created index: fromUserId + status + updatedAt (sent requests)');
    } else {
      console.log('  ○ Index already exists: sent_requests');
    }

    // Create notifications collection indexes
    console.log('\nCreating indexes for notifications collection...');
    const notificationsCollection = db.collection('notifications');

    if (await safeCreateIndex(notificationsCollection, { userId: 1, createdAt: -1 }, 'user_notifications')) {
      console.log('  ✓ Created index: userId + createdAt (user notifications)');
    } else {
      console.log('  ○ Index already exists: user_notifications');
    }
    if (await safeCreateIndex(notificationsCollection, { userId: 1, read: 1 }, 'unread_notifications')) {
      console.log('  ✓ Created index: userId + read (unread count)');
    } else {
      console.log('  ○ Index already exists: unread_notifications');
    }
    if (await safeCreateIndex(notificationsCollection, { refId: 1, type: 1 }, 'notification_ref_lookup')) {
      console.log('  ✓ Created index: refId + type');
    } else {
      console.log('  ○ Index already exists: notification_ref_lookup');
    }

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

    if (await safeCreateIndex(profilesCollection, { gender: 1, updatedAt: -1 }, 'gender_updated_at')) {
      console.log('  ✓ Created index: gender + updatedAt (filtered updated sort)');
    } else {
      console.log('  ○ Index already exists: gender + updatedAt');
    }

    if (await safeCreateIndex(profilesCollection, { gender: 1, dob: 1 }, 'gender_dob')) {
      console.log('  ✓ Created index: gender + dob (filtered age sort)');
    } else {
      console.log('  ○ Index already exists: gender + dob');
    }

    // Index for name search (regex queries benefit from this for anchored patterns)
    if (await safeCreateIndex(profilesCollection, { firstName: 1 }, 'firstname_search')) {
      console.log('  ✓ Created index: firstName (name search)');
    } else {
      console.log('  ○ Index already exists: firstName');
    }

    // Sparse index for FCM token deduplication — allows fast lookup when a new device
    // registers and we need to clear the token off any other profile that holds it
    if (await safeCreateIndex(profilesCollection, { fcmToken: 1 }, 'fcm_token_lookup', { sparse: true })) {
      console.log('  ✓ Created sparse index: fcmToken (push token deduplication)');
    } else {
      console.log('  ○ Index already exists: fcmToken');
    }

    console.log('\nCreating indexes for connection_quotas collection...');
    const quotasCollection = db.collection('connection_quotas');
    await quotasCollection.createIndex(
      { updatedAt: -1 },
      { name: 'quota_updated_at' }
    );
    console.log('  ✓ Created index: updatedAt');

    console.log('\nCreating indexes for contact_messages collection...');
    const contactCollection = db.collection('contact_messages');
    await contactCollection.createIndex(
      { status: 1, createdAt: -1 },
      { name: 'contact_status_created_at' }
    );
    console.log('  ✓ Created index: status + createdAt');
    await contactCollection.createIndex(
      { subject: 1, createdAt: -1 },
      { name: 'contact_subject_created_at' }
    );
    console.log('  ✓ Created index: subject + createdAt');

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
