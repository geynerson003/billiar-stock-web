/**
 * Sale Domain Models
 * Representa una venta en el negocio
 */

export type SaleType = "TABLE" | "EXTERNAL";
export type PaymentMethod = "CASH" | "CARD" | "TRANSFER" | "OTHER";

export interface SaleItem {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    saleByBasket: boolean;
}

export interface Sale {
    id: string;
    items: SaleItem[];
    totalAmount: number;
    profit: number;
    date: number;
    tableId?: string | null;
    type: SaleType;
    sellerId: string;
    clientId: string;
    isPaid: boolean;
    isGameSale: boolean;
    gameId?: string | null;
    productId?: string;
    productName?: string;
    quantity?: number;
    price?: number;
}

export interface Payment {
    id: string;
    clientId: string;
    amount: number;
    date: number;
    description: string;
    paymentMethod: PaymentMethod;
    relatedSales: string[];
    isPartialPayment: boolean;
    notes: string;
}

export const defaultSaleItem: Partial<SaleItem> = {
    quantity: 0,
    unitPrice: 0,
    totalPrice: 0,
    saleByBasket: false,
};

export const defaultSale: Partial<Sale> = {
    items: [],
    totalAmount: 0,
    profit: 0,
    date: Date.now(),
    isPaid: false,
    isGameSale: false,
    type: "EXTERNAL",
};

export const defaultPayment: Partial<Payment> = {
    date: Date.now(),
    relatedSales: [],
    isPartialPayment: false,
    notes: "",
};
