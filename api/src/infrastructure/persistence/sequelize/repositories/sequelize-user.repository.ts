import { IUserRepository } from "../../../../domain/repositories/user.repository";
import { User } from "../../../../domain/entities/user";
import { AspNetUser } from "../models/aspNetUser.model";
import { AspNetUserRole } from "../models/aspNetUserRole.model";
import { AspNetRole } from "../models/aspNetRole.model";

export class SequelizeUserRepository implements IUserRepository {
  async findByNormalizedEmail(normalizedEmail: string): Promise<User | null> {
    const record = await AspNetUser.findOne({
      where: { NormalizedEmail: normalizedEmail }
    });
    return record ? this.toDomain(record) : null;
  }

  async findById(id: string): Promise<User | null> {
    const record = await AspNetUser.findByPk(id);
    return record ? this.toDomain(record) : null;
  }

  async create(user: Omit<User, "createdAt">): Promise<User> {
    const record = await AspNetUser.create({
      Id: user.id,
      UserName: user.userName,
      NormalizedUserName: user.normalizedUserName,
      Email: user.email,
      NormalizedEmail: user.normalizedEmail,
      EmailConfirmed: user.emailConfirmed,
      PasswordHash: user.passwordHash,
      SecurityStamp: user.securityStamp,
      ConcurrencyStamp: user.concurrencyStamp,
      FullName: user.fullName,
      ShippingAddress: user.shippingAddress,
      IsActive: user.isActive,
      PhoneNumberConfirmed: false,
      TwoFactorEnabled: false,
      LockoutEnabled: false,
      AccessFailedCount: 0
    });
    return this.toDomain(record);
  }

  async hasRole(userId: string, roleId: string): Promise<boolean> {
    const userRole = await AspNetUserRole.findOne({
      where: { UserId: userId, RoleId: roleId }
    });
    return userRole !== null;
  }

  async getUserRoleNames(userId: string): Promise<string[]> {
    // Get all role IDs for this user
    const userRoles = await AspNetUserRole.findAll({
      where: { UserId: userId },
      attributes: ["RoleId"]
    });

    if (userRoles.length === 0) {
      return [];
    }

    const roleIds = userRoles.map((ur: any) => ur.RoleId);

    // Query the roles by their IDs
    const roles = await AspNetRole.findAll({
      where: { Id: roleIds },
      attributes: ["Name"]
    });

    return roles
      .map((role: any) => role.Name)
      .filter((name: string | null | undefined): name is string => Boolean(name));
  }

  async assignRole(userId: string, roleId: string): Promise<void> {
    await AspNetUserRole.create({ UserId: userId, RoleId: roleId });
  }

  async update(
    id: string,
    data: Partial<Pick<User, "shippingAddress" | "fullName" | "concurrencyStamp" | "securityStamp">>
  ): Promise<void> {
    const updateData: Record<string, unknown> = {};
    if (data.shippingAddress !== undefined) updateData["ShippingAddress"] = data.shippingAddress;
    if (data.fullName !== undefined) updateData["FullName"] = data.fullName;
    if (data.concurrencyStamp !== undefined) updateData["ConcurrencyStamp"] = data.concurrencyStamp;
    if (data.securityStamp !== undefined) updateData["SecurityStamp"] = data.securityStamp;

    await AspNetUser.update(updateData, { where: { Id: id } });
  }

  private toDomain(record: AspNetUser): User {
    return {
      id: record.Id,
      email: record.Email ?? "",
      normalizedEmail: record.NormalizedEmail ?? "",
      userName: record.UserName ?? "",
      normalizedUserName: record.NormalizedUserName ?? "",
      fullName: record.FullName,
      passwordHash: record.PasswordHash ?? "",
      shippingAddress: record.ShippingAddress,
      isActive: record.IsActive,
      emailConfirmed: record.EmailConfirmed,
      createdAt: record.CreatedAt,
      securityStamp: record.SecurityStamp ?? "",
      concurrencyStamp: record.ConcurrencyStamp ?? ""
    };
  }
}
