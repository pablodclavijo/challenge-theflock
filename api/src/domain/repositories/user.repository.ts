import { User } from "../entities/user";

export interface IUserRepository {
  findByNormalizedEmail(normalizedEmail: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(user: Omit<User, "createdAt">): Promise<User>;
  assignRole(userId: string, roleId: string): Promise<void>;
  hasRole(userId: string, roleId: string): Promise<boolean>;
  update(id: string, data: Partial<Pick<User, "shippingAddress" | "fullName" | "concurrencyStamp" | "securityStamp">>): Promise<void>;
}
