import { ObjectId } from 'mongodb';
import { getDatabase } from '../db/mongodb.js';
import { ContactMessage, ContactMessageStatus, ContactSubject } from '../models/contactMessage.js';

const COLLECTION_NAME = 'contact_messages';

/**
 * Create a new contact message
 * @param name - Sender's name
 * @param email - Sender's email
 * @param subject - Message subject
 * @param message - Message content
 * @returns Created contact message
 */
export async function createContactMessage(
  name: string,
  email: string,
  subject: ContactSubject,
  message: string
): Promise<ContactMessage> {
  const db = await getDatabase();
  const collection = db.collection<ContactMessage>(COLLECTION_NAME);

  const now = new Date();
  const contactMessage: ContactMessage = {
    name,
    email,
    subject,
    message,
    status: ContactMessageStatus.NEW,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(contactMessage);
  return { ...contactMessage, _id: result.insertedId };
}

/**
 * Get all contact messages with optional status filter
 * @param status - Optional status filter
 * @param limit - Maximum number of messages to return
 * @param skip - Number of messages to skip
 * @returns Array of contact messages
 */
export async function getContactMessages(
  status?: ContactMessageStatus,
  limit: number = 50,
  skip: number = 0
): Promise<ContactMessage[]> {
  const db = await getDatabase();
  const collection = db.collection<ContactMessage>(COLLECTION_NAME);

  const filter: Record<string, unknown> = {};
  if (status) {
    filter.status = status;
  }

  const messages = await collection
    .find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  return messages;
}

/**
 * Get contact message by ID
 * @param messageId - Message ID
 * @returns Contact message or null
 */
export async function getContactMessageById(
  messageId: string
): Promise<ContactMessage | null> {
  const db = await getDatabase();
  const collection = db.collection<ContactMessage>(COLLECTION_NAME);

  try {
    const message = await collection.findOne({
      _id: new ObjectId(messageId),
    });
    return message;
  } catch {
    return null;
  }
}

/**
 * Update contact message status
 * @param messageId - Message ID
 * @param status - New status
 * @param adminNotes - Optional admin notes
 * @returns Updated contact message or null
 */
export async function updateContactMessageStatus(
  messageId: string,
  status: ContactMessageStatus,
  adminNotes?: string
): Promise<ContactMessage | null> {
  const db = await getDatabase();
  const collection = db.collection<ContactMessage>(COLLECTION_NAME);

  const updateData: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
  };

  if (adminNotes !== undefined) {
    updateData.adminNotes = adminNotes;
  }

  const message = await collection.findOneAndUpdate(
    { _id: new ObjectId(messageId) },
    { $set: updateData },
    { returnDocument: 'after' }
  );

  return message;
}

/**
 * Get count of messages by status
 * @returns Object with counts for each status
 */
export async function getMessageCounts(): Promise<Record<string, number>> {
  const db = await getDatabase();
  const collection = db.collection<ContactMessage>(COLLECTION_NAME);

  const [total, newCount, inProgress, resolved, closed] = await Promise.all([
    collection.countDocuments({}),
    collection.countDocuments({ status: ContactMessageStatus.NEW }),
    collection.countDocuments({ status: ContactMessageStatus.IN_PROGRESS }),
    collection.countDocuments({ status: ContactMessageStatus.RESOLVED }),
    collection.countDocuments({ status: ContactMessageStatus.CLOSED }),
  ]);

  return {
    total,
    new: newCount,
    inProgress,
    resolved,
    closed,
  };
}

/**
 * Delete a contact message (admin only)
 * @param messageId - Message ID
 * @returns true if deleted, false if not found
 */
export async function deleteContactMessage(messageId: string): Promise<boolean> {
  const db = await getDatabase();
  const collection = db.collection<ContactMessage>(COLLECTION_NAME);

  const result = await collection.deleteOne({ _id: new ObjectId(messageId) });
  return result.deletedCount > 0;
}
