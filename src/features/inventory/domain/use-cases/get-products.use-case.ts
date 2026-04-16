/**
 * Get Products Use Case
 * Obtiene todos los productos con métricas
 */

import type { IProductRepository } from "../../domain/interfaces";
import type { ProductWithMetrics } from "../../domain/models";

export class GetProductsUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(userId: string): Promise<ProductWithMetrics[]> {
    const products = await this.productRepository.getProducts(userId);
    return this.productRepository.calculateMetricsForMany(products);
  }
}
