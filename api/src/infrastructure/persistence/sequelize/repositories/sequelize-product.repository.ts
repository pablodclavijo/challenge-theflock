import { Op } from "sequelize";
import {
  IProductRepository,
  PaginatedResult,
  ProductFilters
} from "../../../../domain/repositories/product.repository";
import { Product as ProductDomain } from "../../../../domain/entities/product";
import { Product } from "../models/product.model";
import { Category } from "../models/category.model";

export class SequelizeProductRepository implements IProductRepository {
  async findAll(filters: ProductFilters): Promise<PaginatedResult<ProductDomain>> {
    const { page = 1, limit = 20, category, minPrice, maxPrice, search } = filters;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = { isActive: true };

    if (category !== undefined) {
      where.categoryId = category;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter: Record<symbol, number> = {};
      if (minPrice !== undefined) priceFilter[Op.gte] = minPrice;
      if (maxPrice !== undefined) priceFilter[Op.lte] = maxPrice;
      where.price = priceFilter;
    }

    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [{ model: Category, as: "category", attributes: ["name"] }],
      limit,
      offset,
      order: [["id", "ASC"]]
    });

    const total = Number(count);

    return {
      data: rows.map((r) => this.toDomain(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findById(id: number): Promise<ProductDomain | null> {
    const record = await Product.findOne({
      where: { id, isActive: true },
      include: [{ model: Category, as: "category", attributes: ["name"] }]
    });

    return record ? this.toDomain(record) : null;
  }

  private toDomain(record: Product): ProductDomain {
    const categoryAssoc = (record as unknown as { category?: { name: string } }).category;

    return {
      id: record.id,
      name: record.name,
      description: record.description,
      price: Number(record.price),
      stock: record.stock,
      categoryId: record.categoryId,
      categoryName: categoryAssoc?.name,
      imageUrl: record.imageUrl,
      isActive: record.isActive as boolean,
      createdAt: record.createdAt as Date,
      updatedAt: record.updatedAt as Date
    };
  }
}
