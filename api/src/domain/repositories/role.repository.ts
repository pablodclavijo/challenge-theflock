export interface IRoleRepository {
  /**
   * Finds the ID of a role by its name.
   * @param roleName The name of the role (e.g., "Comprador")
   * @returns The role ID, or null if not found
   */
  findIdByName(roleName: string): Promise<string | null>;
}
