export interface Profile {
  _id: string; // Same as user id: "u_12345"
  name: string;
  gender: 'M' | 'F';
  dob: string; // Format: "1993-06-10"
  age: number;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

