/**
 * Add Product Use Case
 * Crea un nuevo producto en el inventario
 */

import type { IProductRepository } from "../../domain/interfaces";
import type { Product } from "../../domain/models";

export interface AddProductInput {
  name: string;
  stock: number;
  supplierPrice: number;
  salePrice: number;
  minStock: number;
  saleBasketPrice?: number | null;
  unitsPerPackage: number;
}

export class AddProductUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(userId: string, input: AddProductInput): Promise<string> {
    const product: Omit<Product, "id"> = {
      name: input.name,
      stock: input.stock,
      supplierPrice: input.supplierPrice,
      salePrice: input.salePrice,
      minStock: input.minStock,
      saleBasketPrice: input.saleBasketPrice,
      unitsPerPackage: input.unitsPerPackage,
    };

    return this.productRepository.addProduct(userId, product);
  }
}
