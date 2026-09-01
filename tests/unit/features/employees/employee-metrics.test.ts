import { describe, expect, it } from "vitest";
import { buildEmployeeMetrics } from "../../../../src/features/employees/utils/employee-metrics";
import {
  makeExpense,
  makePayment,
  makeProduct,
  makeSale,
  makeSaleItem,
} from "../../../helpers/factories";

const products = [makeProduct({ id: "p1", supplierPrice: 10, unitsPerPackage: 1 })];

describe("buildEmployeeMetrics", () => {
  it("atribuye ventas, cobros y gastos por id de actor", () => {
    const data = {
      sales: [
        makeSale({ id: "s1", sellerId: "emp-1", isPaid: true, totalAmount: 100 }),
        makeSale({ id: "s2", sellerId: "otro", isPaid: true, totalAmount: 999 }),
      ],
      payments: [
        makePayment({ id: "pay1", registeredBy: "emp-1", amount: 40 }),
        makePayment({ id: "pay2", registeredBy: "otro", amount: 999 }),
      ],
      expenses: [
        makeExpense({ id: "e1", createdBy: "emp-1", amount: 15 }),
        makeExpense({ id: "e2", createdBy: "otro", amount: 999 }),
      ],
      products,
    };
    const m = buildEmployeeMetrics("emp-1", data);
    expect(m.salesCount).toBe(1);
    expect(m.salesTotal).toBe(100);
    expect(m.paymentsTotal).toBe(40);
    expect(m.expensesTotal).toBe(15);
  });

  it("netContribution = profitGenerated - expensesTotal", () => {
    const data = {
      sales: [
        makeSale({
          sellerId: "emp-1",
          isPaid: true,
          totalAmount: 40,
          items: [makeSaleItem({ productId: "p1", unitPrice: 20, quantity: 2 })],
        }),
      ],
      payments: [],
      expenses: [makeExpense({ createdBy: "emp-1", amount: 5 })],
      products,
    };
    const m = buildEmployeeMetrics("emp-1", data);
    expect(m.profitGenerated).toBe(20);
    expect(m.netContribution).toBe(15);
  });

  it("cuenta ventas pendientes", () => {
    const data = {
      sales: [
        makeSale({ sellerId: "emp-1", isPaid: false, totalAmount: 30 }),
        makeSale({ sellerId: "emp-1", isPaid: true, totalAmount: 10 }),
      ],
      payments: [],
      expenses: [],
      products,
    };
    const m = buildEmployeeMetrics("emp-1", data);
    expect(m.pendingSalesCount).toBe(1);
    expect(m.pendingSalesAmount).toBe(30);
  });

  it("respeta la ventana temporal", () => {
    const data = {
      sales: [
        makeSale({ sellerId: "emp-1", isPaid: true, totalAmount: 100, date: 1_000 }),
        makeSale({ sellerId: "emp-1", isPaid: true, totalAmount: 50, date: 10_000 }),
      ],
      payments: [],
      expenses: [],
      products,
    };
    const m = buildEmployeeMetrics("emp-1", data, { start: 5_000, end: 20_000 });
    expect(m.salesTotal).toBe(50);
  });
});
