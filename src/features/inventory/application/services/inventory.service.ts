/**
 * Inventory Service
 * Capa de aplicación - Orquesta los use cases
 */

import type {
  AddProductInput,
  AddProductUseCase,
  DeleteProductUseCase,
  GetProductsUseCase,
  IProductRepository,
  UpdateProductInput,
  UpdateProductUseCase,
  WatchProductsUseCase,
} from "../../domain";
import { AddProductUseCase as AddProduct } from "../../domain";
import { DeleteProductUseCase as DeleteProduct } from "../../domain";
import { GetProductsUseCase as GetProducts } from "../../domain";
import { UpdateProductUseCase as UpdateProduct } from "../../domain";
import { WatchProductsUseCase as WatchProducts } from "../../domain";

export class InventoryService {
  private addProductUseCase: AddProductUseCase;
  private updateProductUseCase: UpdateProductUseCase;
  private deleteProductUseCase: DeleteProductUseCase;
  private getProductsUseCase: GetProductsUseCase;
  private watchProductsUseCase: WatchProductsUseCase;

  constructor(productRepository: IProductRepository) {
    this.addProductUseCase = new AddProduct(productRepository);
    this.updateProductUseCase = new UpdateProduct(productRepository);
    this.deleteProductUseCase = new DeleteProduct(productRepository);
    this.getProductsUseCase = new GetProducts(productRepository);
    this.watchProductsUseCase = new WatchProducts(productRepository);
  }

  async addProduct(userId: string, input: AddProductInput): Promise<string> {
    return this.addProductUseCase.execute(userId, input);
  }

  async updateProduct(userId: string, input: UpdateProductInput): Promise<void> {
    return this.updateProductUseCase.execute(userId, input);
  }

  async deleteProduct(userId: string, productId: string): Promise<void> {
    return this.deleteProductUseCase.execute(userId, productId);
  }

  async getProducts(userId: string) {
    return this.getProductsUseCase.execute(userId);
  }

  watchProducts(userId: string, callback: (data: any) => void): () => void {
    return this.watchProductsUseCase.execute(userId, callback);
  }
}
