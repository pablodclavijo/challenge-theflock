import { Category } from "../../../infrastructure/persistence/sequelize/models/category.model";

export interface CategoryDTO {
  id: number;
  name: string;
}

export class ListCategoriesUseCase {
  async execute(): Promise<CategoryDTO[]> {
    const categories = await Category.findAll({
      where: { isActive: true },
      attributes: ["id", "name"],
      order: [["name", "ASC"]]
    });

    return categories.map((c) => ({ id: c.id!, name: c.name }));
  }
}
