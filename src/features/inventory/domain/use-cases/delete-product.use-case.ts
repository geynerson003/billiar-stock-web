/**
 * Delete Product Use Case
 * Elimina un producto del inventario
 */

import type { IProductRepository } from "../../domain/interfaces";

export class DeleteProductUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(userId: string, productId: string): Promise<void> {
    await this.productRepository.deleteProduct(userId, productId);
  }
}
