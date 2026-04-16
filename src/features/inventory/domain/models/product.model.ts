/**
 * Product Domain Model
 * Representa un producto en el inventario
 */

export interface Product {
  id: string;
  name: string;
  stock: number;
  supplierPrice: number;
  salePrice: number;
  minStock: number;
  saleBasketPrice?: number | null;
  unitsPerPackage: number;
}

export interface ProductMetrics {
  profitPerUnit: number;
  profitPerBasket: number;
  profitMarginPercentage: number;
  totalValue: number;
  isLowStock: boolean;
}

export interface ProductWithMetrics extends Product {
  metrics: ProductMetrics;
}

export const defaultProduct: Product = {
  id: "",
  name: "",
  stock: 0,
  supplierPrice: 0,
  salePrice: 0,
  minStock: 0,
  saleBasketPrice: null,
  unitsPerPackage: 1,
};
