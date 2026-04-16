/**
 * Sales Service
 * Capa de aplicación - Orquesta los use cases
 */

import type { CreateSaleInput, CreateSaleUseCase as CreateSale, GetSalesUseCase as GetSales, ISaleRepository, RecordPaymentInput, RecordPaymentUseCase as RecordPayment, WatchSalesUseCase as WatchSales } from "../../domain";
import { CreateSaleUseCase } from "../../domain";
import { GetSalesUseCase } from "../../domain";
import { RecordPaymentUseCase } from "../../domain";
import { WatchSalesUseCase } from "../../domain";

export class SalesService {
    private createSaleUseCase: CreateSale;
    private getSalesUseCase: GetSales;
    private watchSalesUseCase: WatchSales;
    private recordPaymentUseCase: RecordPayment;

    constructor(saleRepository: ISaleRepository) {
        this.createSaleUseCase = new CreateSaleUseCase(saleRepository);
        this.getSalesUseCase = new GetSalesUseCase(saleRepository);
        this.watchSalesUseCase = new WatchSalesUseCase(saleRepository);
        this.recordPaymentUseCase = new RecordPaymentUseCase(saleRepository);
    }

    async createSale(userId: string, input: CreateSaleInput): Promise<string> {
        return this.createSaleUseCase.execute(userId, input);
    }

    async getSales(userId: string) {
        return this.getSalesUseCase.execute(userId);
    }

    watchSales(userId: string, callback: (data: any) => void): () => void {
        return this.watchSalesUseCase.execute(userId, callback);
    }

    async recordPayment(userId: string, input: RecordPaymentInput): Promise<string> {
        return this.recordPaymentUseCase.execute(userId, input);
    }
}
