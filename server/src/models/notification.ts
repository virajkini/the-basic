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
  read: boolean;
  createdAt: Date;
}

export interface NotificationWithActor extends Notification {
  actor?: {
    userId: string;
    name: string;
    profilePictureUrl?: string;
  };
}
