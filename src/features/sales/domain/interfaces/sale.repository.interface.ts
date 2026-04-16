/**
 * Sale Repository Interface
 * Abstracción para acceso a datos de ventas
 */

import type { Payment, Sale } from "../models";

export interface ISaleRepository {
    // Lectura de Ventas
    getSale(userId: string, saleId: string): Promise<Sale | null>;
    getSales(userId: string): Promise<Sale[]>;
    watchSales(userId: string, callback: (sales: Sale[]) => void): () => void;

    // Filtros
    getSalesByClient(userId: string, clientId: string): Promise<Sale[]>;
    getSalesByDateRange(userId: string, startDate: number, endDate: number): Promise<Sale[]>;
    getSalesByType(userId: string, type: "TABLE" | "EXTERNAL"): Promise<Sale[]>;

    // Escritura
    createSale(userId: string, sale: Omit<Sale, "id">): Promise<string>;
    updateSale(userId: string, saleId: string, changes: Partial<Sale>): Promise<void>;
    deleteSale(userId: string, saleId: string): Promise<void>;

    // Pagos
    getPayments(userId: string): Promise<Payment[]>;
    createPayment(userId: string, payment: Omit<Payment, "id">): Promise<string>;
    recordPayment(userId: string, clientId: string, amount: number, relatedSales: string[]): Promise<string>;
}
