/**
 * Firebase Product API
 * Wrapper sobre el servicio Firebase para operaciones con productos
 */

import type { Unsubscribe } from "firebase/firestore";
import { addDoc, doc } from "firebase/firestore";
import type { Product, ProductWithMetrics } from "../../domain/models";
import { defaultProduct } from "../../domain/models";
import { firebaseFirestoreService } from "../../../../shared/services";

export class FirebaseProductAPI {
  async getProduct(userId: string, productId: string): Promise<Product | null> {
    const ref = firebaseFirestoreService.getBusinessDoc<Product>(userId, "products", productId);
    const doc = await firebaseFirestoreService.getDoc(ref);
    if (!doc) return null;
    return { ...defaultProduct, ...doc, id: productId } as Product;
  }

  async getProducts(userId: string): Promise<Product[]> {
    const ref = firebaseFirestoreService.getBusinessCollection<Product>(userId, "products");
    const docs = await firebaseFirestoreService.getCollection(ref);
    return docs.map((doc, index) => ({
      ...defaultProduct,
      ...doc,
      id: (doc as any)?.id || `product-${index}`,
    } as Product));
  }

  watchProducts(userId: string, callback: (products: Product[]) => void): Unsubscribe {
    const ref = firebaseFirestoreService.getBusinessCollection<Product>(userId, "products");
    return firebaseFirestoreService.watchCollection(
      ref,
      (snapshot: any) => {
        const data = snapshot.data();
        return { ...defaultProduct, ...data, id: snapshot.id } as Product;
      },
      (products) => callback(products)
    );
  }

  watchProduct(userId: string, productId: string, callback: (product: Product | null) => void): Unsubscribe {
    const ref = firebaseFirestoreService.getBusinessDoc<Product>(userId, "products", productId);
    return firebaseFirestoreService.watchDoc(
      ref,
      (snapshot: any) => {
        if (!snapshot.exists()) return null;
        const data = snapshot.data();
        return { ...defaultProduct, ...data, id: productId } as Product;
      },
      (product) => callback(product)
    );
  }

  async addProduct(userId: string, product: Omit<Product, "id">): Promise<string> {
    const ref = firebaseFirestoreService.getBusinessCollection<Product>(userId, "products");
    const docRef = await addDoc(ref, product as any);
    return docRef.id;
  }

  async updateProduct(userId: string, productId: string, changes: Partial<Product>): Promise<void> {
    const ref = firebaseFirestoreService.getBusinessDoc<Product>(userId, "products", productId);
    await firebaseFirestoreService.updateDoc(ref, changes);
  }

  async deleteProduct(userId: string, productId: string): Promise<void> {
    const ref = firebaseFirestoreService.getBusinessDoc<Product>(userId, "products", productId);
    await firebaseFirestoreService.deleteDoc(ref);
  }

  async searchProducts(userId: string, query: string): Promise<Product[]> {
    // Implementar búsqueda (por ahora retorna todos)
    return this.getProducts(userId);
  }

  calculateMetrics(product: Product): ProductWithMetrics {
    const cost = product.stock * product.supplierPrice;
    const revenue = product.stock * product.salePrice;
    const profit = revenue - cost;
    const profitPerUnit = product.salePrice - product.supplierPrice;
    const profitPerBasket = profitPerUnit * product.unitsPerPackage;
    const profitMarginPercentage = product.salePrice > 0 ? (profitPerUnit / product.salePrice) * 100 : 0;
    const totalValue = product.stock * product.salePrice;

    return {
      ...product,
      metrics: {
        profitPerUnit,
        profitPerBasket,
        profitMarginPercentage,
        totalValue,
        isLowStock: product.stock <= product.minStock,
      },
    };
  }

  calculateMetricsForMany(products: Product[]): ProductWithMetrics[] {
    return products.map((p) => this.calculateMetrics(p));
  }
}
