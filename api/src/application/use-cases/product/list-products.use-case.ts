import { IProductRepository } from "../../../domain/repositories/product.repository";
import { ListProductsQueryDto, PaginatedProductsDto, ProductResponseDto } from "../../dtos/product.dto";

export class ListProductsUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(filters: ListProductsQueryDto): Promise<PaginatedProductsDto> {
    const result = await this.productRepository.findAll(filters);

    const data: ProductResponseDto[] = result.data.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      stock: p.stock,
      categoryId: p.categoryId,
      categoryName: p.categoryName,
      imageUrl: p.imageUrl,
      isActive: p.isActive
    }));

    return {
      data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    };
  }
}
