/**
 * Product Repository Interface
 * Abstracción para acceso a datos de productos
 */

import type { Product, ProductWithMetrics } from "../models";

export interface IProductRepository {
  // Lectura
  getProduct(userId: string, productId: string): Promise<Product | null>;
  getProducts(userId: string): Promise<Product[]>;
  watchProducts(userId: string, callback: (products: Product[]) => void): () => void;
  watchProduct(userId: string, productId: string, callback: (product: Product | null) => void): () => void;

  // Escritura
  addProduct(userId: string, product: Omit<Product, "id">): Promise<string>;
  updateProduct(userId: string, productId: string, changes: Partial<Product>): Promise<void>;
  deleteProduct(userId: string, productId: string): Promise<void>;

  // Búsqueda
  searchProducts(userId: string, query: string): Promise<Product[]>;

  // Cálculos
  calculateMetrics(product: Product): ProductWithMetrics;
  calculateMetricsForMany(products: Product[]): ProductWithMetrics[];
}
