/**
 * Métricas por empleado derivadas de los datos existentes.
 *
 * Atribución:
 *  - Ventas: `sale.sellerId === employeeId`
 *  - Cobros: `payment.registeredBy === employeeId`
 *  - Gastos: `expense.createdBy === employeeId`
 *
 * El id del empleado es su `employeeId` (estable). Las ventas/pagos/gastos
 * anteriores a multiusuario quedan atribuidos al dueño (uid del negocio).
 */

import type { Expense, Payment, Product, Sale } from "../../../shared/types/models";
import {
  getExpenseMillis,
  getSaleAmount,
  getSaleProfit,
} from "../../../shared/utils/financial";

export interface DateWindow {
  start: number;
  end: number;
}

export interface EmployeeMetrics {
  salesCount: number;
  salesTotal: number;
  profitGenerated: number;
  pendingSalesCount: number;
  pendingSalesAmount: number;
  paymentsCount: number;
  paymentsTotal: number;
  expensesCount: number;
  expensesTotal: number;
  /** Ganancia generada − gastos registrados. */
  netContribution: number;
}

function inWindow(millis: number, window?: DateWindow): boolean {
  if (!window) return true;
  return millis >= window.start && millis <= window.end;
}

export function buildEmployeeMetrics(
  employeeId: string,
  data: { sales: Sale[]; payments: Payment[]; expenses: Expense[]; products: Product[] },
  window?: DateWindow
): EmployeeMetrics {
  const sales = data.sales.filter(
    (sale) => sale.sellerId === employeeId && inWindow(sale.date, window)
  );
  const payments = data.payments.filter(
    (payment) => payment.registeredBy === employeeId && inWindow(payment.date, window)
  );
  const expenses = data.expenses.filter(
    (expense) => expense.createdBy === employeeId && inWindow(getExpenseMillis(expense), window)
  );

  const salesTotal = sales.reduce((sum, sale) => sum + getSaleAmount(sale), 0);
  const profitGenerated = sales.reduce(
    (sum, sale) => sum + getSaleProfit(sale, data.products),
    0
  );
  const pendingSales = sales.filter((sale) => !sale.isPaid);
  const pendingSalesAmount = pendingSales.reduce((sum, sale) => sum + getSaleAmount(sale), 0);
  const paymentsTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const expensesTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return {
    salesCount: sales.length,
    salesTotal,
    profitGenerated,
    pendingSalesCount: pendingSales.length,
    pendingSalesAmount,
    paymentsCount: payments.length,
    paymentsTotal,
    expensesCount: expenses.length,
    expensesTotal,
    netContribution: profitGenerated - expensesTotal,
  };
}
