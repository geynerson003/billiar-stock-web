/**
 * Create Sale Use Case
 * Crea una nueva venta en el negocio
 */

import type { ISaleRepository, Sale, SaleType } from "../../domain";

export interface CreateSaleInput {
    items: Array<{
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        saleByBasket: boolean;
    }>;
    totalAmount: number;
    profit: number;
    tableId?: string | null;
    type: SaleType;
    sellerId: string;
    clientId: string;
    isPaid: boolean;
    isGameSale: boolean;
    gameId?: string | null;
}

export class CreateSaleUseCase {
    constructor(private saleRepository: ISaleRepository) { }

    async execute(userId: string, input: CreateSaleInput): Promise<string> {
        const totalPrice = input.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

        const sale: Omit<Sale, "id"> = {
            items: input.items.map((item) => ({
                ...item,
                totalPrice: item.unitPrice * item.quantity,
            })),
            totalAmount: totalPrice,
            profit: input.profit,
            date: Date.now(),
            tableId: input.tableId,
            type: input.type,
            sellerId: input.sellerId,
            clientId: input.clientId,
            isPaid: input.isPaid,
            isGameSale: input.isGameSale,
            gameId: input.gameId,
        };

        return this.saleRepository.createSale(userId, sale);
    }
}
