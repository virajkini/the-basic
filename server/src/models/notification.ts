import { ObjectId } from 'mongodb';

export enum NotificationType {
  REQUEST_RECEIVED = 'REQUEST_RECEIVED',
  REQUEST_ACCEPTED = 'REQUEST_ACCEPTED',
  REQUEST_REJECTED = 'REQUEST_REJECTED',
  SHORTLISTED = 'SHORTLISTED',
  CUSTOM = 'CUSTOM',
}

export interface Notification {
  _id?: ObjectId;
  userId: string;
  type: NotificationType;
  refId?: string;
  actorUserId: string;
  actorName?: string;
  title?: string;
  body?: string;
  read: boolean;
  createdAt: Date;
}
