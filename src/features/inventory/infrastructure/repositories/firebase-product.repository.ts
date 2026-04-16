/**
 * Firebase Product Repository
 * Implementación de IProductRepository usando Firebase
 */

import type { IProductRepository, Product, ProductWithMetrics } from "../../domain";
import { FirebaseProductAPI } from "../api/firebase-product.api";

class FirebaseProductRepository implements IProductRepository {
  private firebaseProductAPI: FirebaseProductAPI;

  constructor() {
    this.firebaseProductAPI = new FirebaseProductAPI();
  }

  async getProduct(userId: string, productId: string): Promise<Product | null> {
    return this.firebaseProductAPI.getProduct(userId, productId);
  }

  async getProducts(userId: string): Promise<Product[]> {
    return this.firebaseProductAPI.getProducts(userId);
  }

  watchProducts(userId: string, callback: (products: Product[]) => void): () => void {
    return this.firebaseProductAPI.watchProducts(userId, callback);
  }

  watchProduct(userId: string, productId: string, callback: (product: Product | null) => void): () => void {
    return this.firebaseProductAPI.watchProduct(userId, productId, callback);
  }

  async addProduct(userId: string, product: Omit<Product, "id">): Promise<string> {
    return this.firebaseProductAPI.addProduct(userId, product);
  }

  async updateProduct(userId: string, productId: string, changes: Partial<Product>): Promise<void> {
    return this.firebaseProductAPI.updateProduct(userId, productId, changes);
  }

  async deleteProduct(userId: string, productId: string): Promise<void> {
    return this.firebaseProductAPI.deleteProduct(userId, productId);
  }

  async searchProducts(userId: string, query: string): Promise<Product[]> {
    return this.firebaseProductAPI.searchProducts(userId, query);
  }

  calculateMetrics(product: Product): ProductWithMetrics {
    return this.firebaseProductAPI.calculateMetrics(product);
  }

  calculateMetricsForMany(products: Product[]): ProductWithMetrics[] {
    return this.firebaseProductAPI.calculateMetricsForMany(products);
  }
}

// Singleton
export const firebaseProductRepository = new FirebaseProductRepository();
