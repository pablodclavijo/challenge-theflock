export interface User {
  id: string;
  email: string;
  normalizedEmail: string;
  userName: string;
  normalizedUserName: string;
  fullName: string;
  passwordHash: string;
  shippingAddress: string | null;
  isActive: boolean;
  emailConfirmed: boolean;
  createdAt: Date;
  securityStamp: string;
  concurrencyStamp: string;
}
