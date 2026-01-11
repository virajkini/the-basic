import { ObjectId } from 'mongodb';

export enum ConnectionStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export interface Connection {
  _id?: ObjectId;
  fromUserId: string;
  toUserId: string;
  status: ConnectionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConnectionWithProfile extends Connection {
  profile?: {
    userId: string;
    name: string;
    profilePictureUrl?: string;
  };
}
