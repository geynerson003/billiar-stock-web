/**
 * Watch Sales Use Case
 * Observa cambios en tiempo real en las ventas
 */

import type { ISaleRepository, Sale } from "../../domain";

export class WatchSalesUseCase {
    constructor(private saleRepository: ISaleRepository) { }

    execute(userId: string, callback: (sales: Sale[]) => void): () => void {
        return this.saleRepository.watchSales(userId, callback);
    }
}
