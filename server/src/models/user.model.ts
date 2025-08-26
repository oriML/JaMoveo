export interface User {
  id: string;
  username: string;
  password_hash?: string;
  role: Role;
  instrument?: string;
  secret_key?: string; // New: Optional secret key for admin login
}

export enum Role {
  Admin = 'ADMIN',
  User = 'USER',
}
