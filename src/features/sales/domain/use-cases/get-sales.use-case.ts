/**
 * Get Sales Use Case
 * Obtiene todas las ventas del usuario
 */

import type { ISaleRepository, Sale } from "../../domain";

export class GetSalesUseCase {
    constructor(private saleRepository: ISaleRepository) { }

    async execute(userId: string): Promise<Sale[]> {
        return this.saleRepository.getSales(userId);
    }
}
