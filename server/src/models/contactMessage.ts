import { ObjectId } from 'mongodb';

export enum ContactMessageStatus {
  NEW = 'NEW',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum ContactSubject {
  GENERAL = 'general',
  ACCOUNT = 'account',
  TECHNICAL = 'technical',
  FEEDBACK = 'feedback',
  REPORT = 'report',
  PARTNERSHIP = 'partnership',
  OTHER = 'other',
}

export interface ContactMessage {
  _id?: ObjectId;
  name: string;
  email?: string; // Optional, either email or phone required
  phone?: string; // Optional, either email or phone required
  subject: ContactSubject;
  message: string;
  status: ContactMessageStatus;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}
