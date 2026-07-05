export interface User {
  _id: string; // Format: "u_12345"
  phone?: string;
  email?: string;
  authProvider: 'phone' | 'google';
  createdAt: Date;
}



