/**
 * Dashboard Service
 * Agregador de métricas y datos para el dashboard
 *
 * Nota: La página DashboardPage actualmente usa buildDashboardSummary de shared/utils/financial
 * directamente con datos en tiempo real. Este servicio está disponible para uso programático
 * o futuras integraciones donde se necesite acceso fuera de componentes React.
 */

import type {
  DashboardMetrics,
  SalesSummary,
  InventorySummary,
  ClientsSummary,
} from "../../domain/models/dashboard-metrics.model";
import type { Sale, Expense, Client, Product } from "../../../../shared/types";
import { getSaleAmount } from "../../../../shared/utils/financial";

export class DashboardService {
  /**
   * Calcula las métricas del dashboard a partir de datos ya cargados
   */
  calculateMetrics(
    sales: Sale[],
    expenses: Expense[],
    clients: Client[],
    products: Product[],
    days: number = 30
  ): DashboardMetrics {
    const now = Date.now();
    const startDate = now - days * 24 * 60 * 60 * 1000;

    const filteredSales = sales.filter((s) => s.date >= startDate && s.isPaid);
    const filteredExpenses = expenses.filter(
      (e) => Number(e.date) >= startDate
    );

    const totalSales = filteredSales.reduce(
      (sum, sale) => sum + getSaleAmount(sale),
      0
    );
    const totalExpenses = filteredExpenses.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );
    const netProfit = totalSales - totalExpenses;
    const pendingPayments = clients.reduce(
      (sum, client) => sum + (client.deuda || 0),
      0
    );
    const lowStockItems = products.filter(
      (p) => p.stock <= p.minStock
    ).length;

    return {
      totalSales,
      totalExpenses,
      netProfit,
      pendingPayments,
      activeTables: 0,
      lowStockItems,
      period: {
        start: startDate,
        end: now,
      },
    };
  }

  /**
   * Calcula resumen de ventas a partir de datos ya cargados
   */
  calculateSalesSummary(sales: Sale[]): SalesSummary {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    const dailySales = sales
      .filter((s) => s.date >= now - oneDay && s.isPaid)
      .reduce((sum, s) => sum + getSaleAmount(s), 0);

    const weeklySales = sales
      .filter((s) => s.date >= now - 7 * oneDay && s.isPaid)
      .reduce((sum, s) => sum + getSaleAmount(s), 0);

    const monthlySales = sales
      .filter((s) => s.date >= now - 30 * oneDay && s.isPaid)
      .reduce((sum, s) => sum + getSaleAmount(s), 0);

    return {
      daily: dailySales,
      weekly: weeklySales,
      monthly: monthlySales,
      trend:
        monthlySales > weeklySales
          ? "up"
          : monthlySales < weeklySales
            ? "down"
            : "stable",
    };
  }

  /**
   * Calcula resumen de inventario a partir de datos ya cargados
   */
  calculateInventorySummary(products: Product[]): InventorySummary {
    const lowStockCount = products.filter(
      (p) => p.stock > 0 && p.stock <= p.minStock
    ).length;
    const outOfStockCount = products.filter((p) => p.stock === 0).length;
    const totalValue = products.reduce(
      (sum, p) => sum + p.stock * p.salePrice,
      0
    );

    return {
      totalItems: products.length,
      lowStockCount,
      outOfStockCount,
      totalValue,
    };
  }

  /**
   * Calcula resumen de clientes a partir de datos ya cargados
   */
  calculateClientsSummary(clients: Client[]): ClientsSummary {
    const clientsWithDebt = clients.filter((c) => c.deuda > 0);
    const totalDebt = clientsWithDebt.reduce(
      (sum, c) => sum + c.deuda,
      0
    );

    return {
      totalClients: clients.length,
      activeClients: clients.length,
      clientsWithDebt: clientsWithDebt.length,
      totalDebt,
    };
  }
}
