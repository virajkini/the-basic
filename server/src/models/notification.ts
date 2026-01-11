import { ObjectId } from 'mongodb';

export enum NotificationType {
  REQUEST_RECEIVED = 'REQUEST_RECEIVED',
  REQUEST_ACCEPTED = 'REQUEST_ACCEPTED',
  REQUEST_REJECTED = 'REQUEST_REJECTED',
}

export interface Notification {
  _id?: ObjectId;
  userId: string;
  type: NotificationType;
  refId: string;
  actorUserId: string;
  actorName?: string;
  read: boolean;
  createdAt: Date;
}
