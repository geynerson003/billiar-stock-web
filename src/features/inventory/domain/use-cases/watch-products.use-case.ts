/**
 * Watch Products Use Case
 * Observa cambios en tiempo real en los productos
 */

import type { IProductRepository } from "../../domain/interfaces";
import type { ProductWithMetrics } from "../../domain/models";

export class WatchProductsUseCase {
  constructor(private productRepository: IProductRepository) {}

  execute(userId: string, callback: (products: ProductWithMetrics[]) => void): () => void {
    return this.productRepository.watchProducts(userId, (products) => {
      const withMetrics = this.productRepository.calculateMetricsForMany(products);
      callback(withMetrics);
    });
  }
}
