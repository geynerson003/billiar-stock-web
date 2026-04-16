/**
 * Firebase Sale Repository
 * Implementación de ISaleRepository usando Firebase
 */

import type { ISaleRepository, Payment, Sale } from "../../domain";
import { FirebaseSaleAPI } from "../api/firebase-sale.api";

class FirebaseSaleRepository implements ISaleRepository {
    private firebaseSaleAPI: FirebaseSaleAPI;

    constructor() {
        this.firebaseSaleAPI = new FirebaseSaleAPI();
    }

    async getSale(userId: string, saleId: string): Promise<Sale | null> {
        return this.firebaseSaleAPI.getSale(userId, saleId);
    }

    async getSales(userId: string): Promise<Sale[]> {
        return this.firebaseSaleAPI.getSales(userId);
    }

    watchSales(userId: string, callback: (sales: Sale[]) => void) {
        return this.firebaseSaleAPI.watchSales(userId, callback);
    }

    async getSalesByClient(userId: string, clientId: string): Promise<Sale[]> {
        return this.firebaseSaleAPI.getSalesByClient(userId, clientId);
    }

    async getSalesByDateRange(userId: string, startDate: number, endDate: number): Promise<Sale[]> {
        return this.firebaseSaleAPI.getSalesByDateRange(userId, startDate, endDate);
    }

    async getSalesByType(userId: string, type: "TABLE" | "EXTERNAL"): Promise<Sale[]> {
        return this.firebaseSaleAPI.getSalesByType(userId, type);
    }

    async createSale(userId: string, sale: Omit<Sale, "id">): Promise<string> {
        return this.firebaseSaleAPI.createSale(userId, sale);
    }

    async updateSale(userId: string, saleId: string, changes: Partial<Sale>): Promise<void> {
        return this.firebaseSaleAPI.updateSale(userId, saleId, changes);
    }

    async deleteSale(userId: string, saleId: string): Promise<void> {
        return this.firebaseSaleAPI.deleteSale(userId, saleId);
    }

    async getPayments(userId: string): Promise<Payment[]> {
        return this.firebaseSaleAPI.getPayments(userId);
    }

    async createPayment(userId: string, payment: Omit<Payment, "id">): Promise<string> {
        return this.firebaseSaleAPI.createPayment(userId, payment);
    }

    async recordPayment(userId: string, clientId: string, amount: number, relatedSales: string[]): Promise<string> {
        return this.firebaseSaleAPI.recordPayment(userId, clientId, amount, relatedSales);
    }
}

// Singleton
export const firebaseSaleRepository = new FirebaseSaleRepository();
