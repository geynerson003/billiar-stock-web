/**
 * Dashboard Models
 * Modelos de dominio para Dashboard
 */

export interface DashboardMetrics {
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  pendingPayments: number;
  activeTables: number;
  lowStockItems: number;
  period: {
    start: number;
    end: number;
  };
}

export interface SalesSummary {
  daily: number;
  weekly: number;
  monthly: number;
  trend: "up" | "down" | "stable";
}

export interface InventorySummary {
  totalItems: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValue: number;
}

export interface ClientsSummary {
  totalClients: number;
  activeClients: number;
  clientsWithDebt: number;
  totalDebt: number;
}

export const defaultDashboardMetrics: DashboardMetrics = {
  totalSales: 0,
  totalExpenses: 0,
  netProfit: 0,
  pendingPayments: 0,
  activeTables: 0,
  lowStockItems: 0,
  period: {
    start: Date.now(),
    end: Date.now(),
  },
};
