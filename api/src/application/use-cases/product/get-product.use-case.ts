import { IProductRepository } from "../../../domain/repositories/product.repository";
import { ProductResponseDto } from "../../dtos/product.dto";
import { NotFoundError } from "../../../shared/errors/AppError";

export class GetProductUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(id: number): Promise<ProductResponseDto> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      categoryId: product.categoryId,
      categoryName: product.categoryName,
      imageUrl: product.imageUrl,
      isActive: product.isActive
    };
  }
}
