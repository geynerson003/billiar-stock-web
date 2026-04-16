/**
 * Firebase Sale API
 * Wrapper sobre el servicio Firebase para operaciones con ventas
 */

import type { Unsubscribe } from "firebase/firestore";
import { addDoc, query, where } from "firebase/firestore";
import type { Payment, Sale } from "../../domain/models";
import { defaultPayment, defaultSale } from "../../domain/models";
import { firebaseFirestoreService } from "../../../../shared/services";

export class FirebaseSaleAPI {
    async getSale(userId: string, saleId: string): Promise<Sale | null> {
        const ref = firebaseFirestoreService.getBusinessDoc<Sale>(userId, "sales", saleId);
        const doc = await firebaseFirestoreService.getDoc(ref);
        if (!doc) return null;
        return { ...defaultSale, ...doc, id: saleId } as Sale;
    }

    async getSales(userId: string): Promise<Sale[]> {
        const ref = firebaseFirestoreService.getBusinessCollection<Sale>(userId, "sales");
        const docs = await firebaseFirestoreService.getCollection(ref);
        return docs.map((doc, index) => ({
            ...defaultSale,
            ...doc,
            id: (doc as any)?.id || `sale-${index}`,
        } as Sale));
    }

    watchSales(userId: string, callback: (sales: Sale[]) => void): Unsubscribe {
        const ref = firebaseFirestoreService.getBusinessCollection<Sale>(userId, "sales");
        return firebaseFirestoreService.watchCollection(
            ref,
            (snapshot: any) => {
                const data = snapshot.data();
                return { ...defaultSale, ...data, id: snapshot.id } as Sale;
            },
            (sales) => callback(sales)
        );
    }

    async getSalesByClient(userId: string, clientId: string): Promise<Sale[]> {
        const ref = firebaseFirestoreService.getBusinessCollection<Sale>(userId, "sales");
        const docs = await firebaseFirestoreService.queryCollection(ref, [where("clientId", "==", clientId)]);
        return docs.map((doc, index) => ({
            ...defaultSale,
            ...doc,
            id: (doc as any)?.id || `sale-${index}`,
        } as Sale));
    }

    async getSalesByDateRange(userId: string, startDate: number, endDate: number): Promise<Sale[]> {
        const ref = firebaseFirestoreService.getBusinessCollection<Sale>(userId, "sales");
        const docs = await firebaseFirestoreService.queryCollection(ref, [
            where("date", ">=", startDate),
            where("date", "<=", endDate),
        ]);
        return docs.map((doc, index) => ({
            ...defaultSale,
            ...doc,
            id: (doc as any)?.id || `sale-${index}`,
        } as Sale));
    }

    async getSalesByType(userId: string, type: "TABLE" | "EXTERNAL"): Promise<Sale[]> {
        const ref = firebaseFirestoreService.getBusinessCollection<Sale>(userId, "sales");
        const docs = await firebaseFirestoreService.queryCollection(ref, [where("type", "==", type)]);
        return docs.map((doc, index) => ({
            ...defaultSale,
            ...doc,
            id: (doc as any)?.id || `sale-${index}`,
        } as Sale));
    }

    async createSale(userId: string, sale: Omit<Sale, "id">): Promise<string> {
        const ref = firebaseFirestoreService.getBusinessCollection<Sale>(userId, "sales");
        const docRef = await addDoc(ref, sale as any);
        return docRef.id;
    }

    async updateSale(userId: string, saleId: string, changes: Partial<Sale>): Promise<void> {
        const ref = firebaseFirestoreService.getBusinessDoc<Sale>(userId, "sales", saleId);
        await firebaseFirestoreService.updateDoc(ref, changes);
    }

    async deleteSale(userId: string, saleId: string): Promise<void> {
        const ref = firebaseFirestoreService.getBusinessDoc<Sale>(userId, "sales", saleId);
        await firebaseFirestoreService.deleteDoc(ref);
    }

    async getPayments(userId: string): Promise<Payment[]> {
        const ref = firebaseFirestoreService.getBusinessCollection<Payment>(userId, "payments");
        const docs = await firebaseFirestoreService.getCollection(ref);
        return docs.map((doc, index) => ({
            ...defaultPayment,
            ...doc,
            id: (doc as any)?.id || `payment-${index}`,
        } as Payment));
    }

    async createPayment(userId: string, payment: Omit<Payment, "id">): Promise<string> {
        const ref = firebaseFirestoreService.getBusinessCollection<Payment>(userId, "payments");
        const docRef = await addDoc(ref, payment as any);
        return docRef.id;
    }

    async recordPayment(userId: string, clientId: string, amount: number, relatedSales: string[]): Promise<string> {
        const payment: Omit<Payment, "id"> = {
            clientId,
            amount,
            date: Date.now(),
            description: `Payment received from ${clientId}`,
            paymentMethod: "CASH",
            relatedSales,
            isPartialPayment: relatedSales.length > 0,
            notes: "",
        };
        return this.createPayment(userId, payment);
    }
}
