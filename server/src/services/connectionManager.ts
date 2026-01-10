import { ObjectId } from 'mongodb';
import { getDatabase } from '../db/mongodb.js';
import { Connection, ConnectionStatus } from '../models/connection.js';

const COLLECTION_NAME = 'connections';

/**
 * Send a connection request from one user to another
 * @param fromUserId - User sending the request
 * @param toUserId - User receiving the request
 * @returns Created connection object
 */
export async function sendRequest(
  fromUserId: string,
  toUserId: string
): Promise<Connection> {
  // Validate: cannot send request to self
  if (fromUserId === toUserId) {
    throw new Error('Cannot send connection request to yourself');
  }

  const db = await getDatabase();
  const collection = db.collection<Connection>(COLLECTION_NAME);

  // Check if connection already exists (in either direction)
  const existingConnection = await collection.findOne({
    $or: [
      { fromUserId, toUserId },
      { fromUserId: toUserId, toUserId: fromUserId },
    ],
  });

  if (existingConnection) {
    if (existingConnection.status === ConnectionStatus.PENDING) {
      throw new Error('A connection request already exists between these users');
    }
    if (existingConnection.status === ConnectionStatus.ACCEPTED) {
      throw new Error('You are already connected with this user');
    }
    if (existingConnection.status === ConnectionStatus.REJECTED) {
      // Allow re-sending if previously rejected - update the existing record
      const now = new Date();
      await collection.updateOne(
        { _id: existingConnection._id },
        {
          $set: {
            fromUserId,
            toUserId,
            status: ConnectionStatus.PENDING,
            updatedAt: now,
          },
        }
      );
      return {
        ...existingConnection,
        fromUserId,
        toUserId,
        status: ConnectionStatus.PENDING,
        updatedAt: now,
      };
    }
  }

  const now = new Date();
  const connection: Connection = {
    fromUserId,
    toUserId,
    status: ConnectionStatus.PENDING,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(connection);
  return { ...connection, _id: result.insertedId };
}

/**
 * Accept a connection request
 * @param connectionId - ID of the connection to accept
 * @param userId - ID of the user accepting (must be toUserId)
 * @returns Updated connection object
 */
export async function acceptRequest(
  connectionId: string,
  userId: string
): Promise<Connection> {
  const db = await getDatabase();
  const collection = db.collection<Connection>(COLLECTION_NAME);

  const connection = await collection.findOne({
    _id: new ObjectId(connectionId),
  });

  if (!connection) {
    throw new Error('Connection request not found');
  }

  // Only recipient can accept
  if (connection.toUserId !== userId) {
    throw new Error('Only the recipient can accept a connection request');
  }

  // Can only accept pending requests
  if (connection.status !== ConnectionStatus.PENDING) {
    throw new Error(`Cannot accept a ${connection.status.toLowerCase()} connection`);
  }

  const now = new Date();
  await collection.updateOne(
    { _id: new ObjectId(connectionId) },
    {
      $set: {
        status: ConnectionStatus.ACCEPTED,
        updatedAt: now,
      },
    }
  );

  return {
    ...connection,
    status: ConnectionStatus.ACCEPTED,
    updatedAt: now,
  };
}

/**
 * Reject a connection request
 * @param connectionId - ID of the connection to reject
 * @param userId - ID of the user rejecting (must be toUserId)
 * @returns Updated connection object
 */
export async function rejectRequest(
  connectionId: string,
  userId: string
): Promise<Connection> {
  const db = await getDatabase();
  const collection = db.collection<Connection>(COLLECTION_NAME);

  const connection = await collection.findOne({
    _id: new ObjectId(connectionId),
  });

  if (!connection) {
    throw new Error('Connection request not found');
  }

  // Only recipient can reject
  if (connection.toUserId !== userId) {
    throw new Error('Only the recipient can reject a connection request');
  }

  // Can only reject pending requests
  if (connection.status !== ConnectionStatus.PENDING) {
    throw new Error(`Cannot reject a ${connection.status.toLowerCase()} connection`);
  }

  const now = new Date();
  await collection.updateOne(
    { _id: new ObjectId(connectionId) },
    {
      $set: {
        status: ConnectionStatus.REJECTED,
        updatedAt: now,
      },
    }
  );

  return {
    ...connection,
    status: ConnectionStatus.REJECTED,
    updatedAt: now,
  };
}

/**
 * Cancel (withdraw) a pending connection request
 * @param connectionId - ID of the connection to cancel
 * @param userId - ID of the user cancelling (must be fromUserId)
 */
export async function cancelRequest(
  connectionId: string,
  userId: string
): Promise<void> {
  const db = await getDatabase();
  const collection = db.collection<Connection>(COLLECTION_NAME);

  const connection = await collection.findOne({
    _id: new ObjectId(connectionId),
  });

  if (!connection) {
    throw new Error('Connection request not found');
  }

  // Only sender can cancel
  if (connection.fromUserId !== userId) {
    throw new Error('Only the sender can cancel a connection request');
  }

  // Can only cancel pending requests
  if (connection.status !== ConnectionStatus.PENDING) {
    throw new Error(`Cannot cancel a ${connection.status.toLowerCase()} connection`);
  }

  await collection.deleteOne({ _id: new ObjectId(connectionId) });
}

/**
 * Get connections for a user with optional filters
 * @param userId - User ID
 * @param status - Optional status filter
 * @param type - Optional type filter: 'sent' or 'received'
 * @param limit - Maximum number of results
 * @param skip - Number to skip for pagination
 * @returns Array of connections
 */
export async function getConnections(
  userId: string,
  status?: ConnectionStatus,
  type?: 'sent' | 'received',
  limit: number = 50,
  skip: number = 0
): Promise<Connection[]> {
  const db = await getDatabase();
  const collection = db.collection<Connection>(COLLECTION_NAME);

  const filter: Record<string, unknown> = {};

  // Filter by type
  if (type === 'sent') {
    filter.fromUserId = userId;
  } else if (type === 'received') {
    filter.toUserId = userId;
  } else {
    // All connections involving this user
    filter.$or = [{ fromUserId: userId }, { toUserId: userId }];
  }

  // Filter by status
  if (status) {
    filter.status = status;
  }

  const connections = await collection
    .find(filter)
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  return connections;
}

/**
 * Get a connection between two specific users
 * @param userId1 - First user ID
 * @param userId2 - Second user ID
 * @returns Connection object or null
 */
export async function getConnectionBetweenUsers(
  userId1: string,
  userId2: string
): Promise<Connection | null> {
  const db = await getDatabase();
  const collection = db.collection<Connection>(COLLECTION_NAME);

  const connection = await collection.findOne({
    $or: [
      { fromUserId: userId1, toUserId: userId2 },
      { fromUserId: userId2, toUserId: userId1 },
    ],
  });

  return connection;
}

/**
 * Get a connection by ID
 * @param connectionId - Connection ID
 * @returns Connection object or null
 */
export async function getConnectionById(
  connectionId: string
): Promise<Connection | null> {
  const db = await getDatabase();
  const collection = db.collection<Connection>(COLLECTION_NAME);

  try {
    const connection = await collection.findOne({
      _id: new ObjectId(connectionId),
    });
    return connection;
  } catch {
    return null;
  }
}
