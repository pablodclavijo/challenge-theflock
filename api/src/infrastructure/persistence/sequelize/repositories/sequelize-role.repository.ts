import { IRoleRepository } from "../../../../domain/repositories/role.repository";
import { AspNetRole } from "../models/aspNetRole.model";

export class SequelizeRoleRepository implements IRoleRepository {
  async findIdByName(roleName: string): Promise<string | null> {
    const role = await AspNetRole.findOne({
      where: { NormalizedName: roleName.toUpperCase() }
    });
    return role?.Id ?? null;
  }
}
