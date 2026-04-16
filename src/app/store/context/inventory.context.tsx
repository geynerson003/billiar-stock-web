/**
 * Inventory Context
 * Capa de presentación - proporciona acceso a operaciones de inventario
 */

import type { PropsWithChildren } from "react";
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { InventoryService } from "../../../features/inventory/application/services";
import { firebaseProductRepository } from "../../../features/inventory/infrastructure";
import type { Product, ProductWithMetrics } from "../../../features/inventory/domain/models";

// Inicializar el servicio con las implementaciones concretas
const inventoryService = new InventoryService(firebaseProductRepository);

export interface InventoryContextValue {
    products: ProductWithMetrics[];
    loading: boolean;
    error: string | null;
    addProduct: (name: string, stock: number, supplierPrice: number, salePrice: number, minStock: number, unitsPerPackage: number, saleBasketPrice?: number | null) => Promise<string>;
    updateProduct: (productId: string, changes: Partial<Product>) => Promise<void>;
    deleteProduct: (productId: string) => Promise<void>;
    getProduct: (productId: string) => ProductWithMetrics | undefined;
}

export const InventoryContext = createContext<InventoryContextValue | undefined>(undefined);

export function InventoryProvider({ children }: PropsWithChildren) {
    const [products, setProducts] = useState<ProductWithMetrics[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    // Obtener userId del AuthContext (lo hacemos a través de localStorage por ahora)
    useEffect(() => {
        const storedUserId = localStorage.getItem("userId");
        if (storedUserId) {
            setUserId(storedUserId);
        }
    }, []);

    // Escuchar cambios en tiempo real
    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = inventoryService.watchProducts(userId, (data) => {
            setProducts(data);
            setLoading(false);
        });

        return unsubscribe;
    }, [userId]);

    const addProduct = useCallback(
        async (
            name: string,
            stock: number,
            supplierPrice: number,
            salePrice: number,
            minStock: number,
            unitsPerPackage: number,
            saleBasketPrice?: number | null
        ): Promise<string> => {
            if (!userId) throw new Error("User not authenticated");
            try {
                const productId = await inventoryService.addProduct(userId, {
                    name,
                    stock,
                    supplierPrice,
                    salePrice,
                    minStock,
                    unitsPerPackage,
                    saleBasketPrice,
                });
                return productId;
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error adding product");
                throw err;
            }
        },
        [userId]
    );

    const updateProduct = useCallback(
        async (productId: string, changes: Partial<Product>): Promise<void> => {
            if (!userId) throw new Error("User not authenticated");
            try {
                await inventoryService.updateProduct(userId, { productId, changes });
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error updating product");
                throw err;
            }
        },
        [userId]
    );

    const deleteProduct = useCallback(
        async (productId: string): Promise<void> => {
            if (!userId) throw new Error("User not authenticated");
            try {
                await inventoryService.deleteProduct(userId, productId);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error deleting product");
                throw err;
            }
        },
        [userId]
    );

    const getProduct = useCallback(
        (productId: string): ProductWithMetrics | undefined => {
            return products.find((p) => p.id === productId);
        },
        [products]
    );

    const value = useMemo<InventoryContextValue>(
        () => ({
            products,
            loading,
            error,
            addProduct,
            updateProduct,
            deleteProduct,
            getProduct,
        }),
        [products, loading, error, addProduct, updateProduct, deleteProduct, getProduct]
    );

    return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}
