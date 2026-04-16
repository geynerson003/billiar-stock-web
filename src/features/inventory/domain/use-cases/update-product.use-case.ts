/**
 * Update Product Use Case
 * Actualiza un producto existente
 */

import type { IProductRepository } from "../../domain/interfaces";
import type { Product } from "../../domain/models";

export interface UpdateProductInput {
  productId: string;
  changes: Partial<Omit<Product, "id">>;
}

export class UpdateProductUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(userId: string, input: UpdateProductInput): Promise<void> {
    await this.productRepository.updateProduct(userId, input.productId, input.changes);
  }
}
