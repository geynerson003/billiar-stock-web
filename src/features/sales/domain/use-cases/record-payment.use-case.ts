/**
 * Record Payment Use Case
 * Registra un pago por cliente
 */

import type { ISaleRepository } from "../../domain";

export interface RecordPaymentInput {
    clientId: string;
    amount: number;
    relatedSales: string[];
    paymentMethod: "CASH" | "CARD" | "TRANSFER" | "OTHER";
    description: string;
    notes: string;
}

export class RecordPaymentUseCase {
    constructor(private saleRepository: ISaleRepository) { }

    async execute(userId: string, input: RecordPaymentInput): Promise<string> {
        return this.saleRepository.recordPayment(userId, input.clientId, input.amount, input.relatedSales);
    }
}
