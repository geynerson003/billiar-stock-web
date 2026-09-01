import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildDashboardDeltas,
  buildDashboardSummary,
  buildReport,
  calculateGameTotal,
  calculatePendingDebt,
  calculateProductFinancials,
  calculateProfitForDraftItems,
  calculateSupplierPricePerUnit,
  getDateRange,
  getExpenseMillis,
  getSaleAmount,
  getSaleProfit,
  prepareGameSales,
} from "../../../../src/shared/utils/financial";
import { setActiveFormatConfig } from "../../../../src/shared/utils/format";
import {
  makeBet,
  makeClient,
  makeExpense,
  makeGame,
  makeParticipant,
  makePayment,
  makeProduct,
  makeSale,
  makeSaleItem,
} from "../../../helpers/factories";

beforeEach(() => {
  setActiveFormatConfig({ locale: "es-CO", currency: "COP" });
});

describe("getSaleAmount", () => {
  it("prioriza totalAmount cuando es > 0", () => {
    expect(getSaleAmount(makeSale({ totalAmount: 500, price: 10 }))).toBe(500);
  });

  it("cae a la suma de items cuando totalAmount es 0", () => {
    const sale = makeSale({
      totalAmount: 0,
      items: [makeSaleItem({ totalPrice: 30 }), makeSaleItem({ totalPrice: 20 })],
    });
    expect(getSaleAmount(sale)).toBe(50);
  });

  it("cae a price cuando no hay totalAmount ni items", () => {
    expect(getSaleAmount(makeSale({ totalAmount: 0, items: [], price: 15 }))).toBe(15);
  });

  it("devuelve 0 cuando no hay ninguna fuente de monto", () => {
    expect(getSaleAmount(makeSale({ totalAmount: 0, items: [], price: undefined }))).toBe(0);
  });
});

describe("calculateSupplierPricePerUnit", () => {
  it("divide el precio de proveedor entre las unidades por paquete", () => {
    expect(calculateSupplierPricePerUnit(120, 12)).toBe(10);
  });

  it("devuelve 0 si unitsPerPackage <= 0", () => {
    expect(calculateSupplierPricePerUnit(120, 0)).toBe(0);
    expect(calculateSupplierPricePerUnit(120, -3)).toBe(0);
  });
});

describe("calculateProfitForDraftItems", () => {
  it("utilidad por unidad = (unitPrice - costo/unidad) * cantidad", () => {
    const products = [makeProduct({ id: "p1", supplierPrice: 120, unitsPerPackage: 12 })];
    const items = [makeSaleItem({ productId: "p1", unitPrice: 20, quantity: 3 })];
    // costo/unidad = 10 -> (20 - 10) * 3 = 30
    expect(calculateProfitForDraftItems(items, products)).toBe(30);
  });

  it("utilidad por canasta = (saleBasketPrice - supplierPrice) * cantidad", () => {
    const products = [
      makeProduct({ id: "p1", supplierPrice: 100, saleBasketPrice: 150 }),
    ];
    const items = [
      makeSaleItem({ productId: "p1", saleByBasket: true, quantity: 2, unitPrice: 150 }),
    ];
    expect(calculateProfitForDraftItems(items, products)).toBe(100);
  });

  it("ignora items cuyo producto ya no existe", () => {
    const items = [makeSaleItem({ productId: "desaparecido", unitPrice: 20, quantity: 5 })];
    expect(calculateProfitForDraftItems(items, [])).toBe(0);
  });
});

describe("getSaleProfit", () => {
  it("venta de juego devuelve el profit congelado", () => {
    expect(getSaleProfit(makeSale({ isGameSale: true, profit: 42 }), [])).toBe(42);
  });

  it("venta de juego con profit no finito devuelve 0", () => {
    expect(getSaleProfit(makeSale({ isGameSale: true, profit: NaN }), [])).toBe(0);
  });

  it("venta con items resolubles recalcula la utilidad", () => {
    const products = [makeProduct({ id: "p1", supplierPrice: 10, unitsPerPackage: 1 })];
    const sale = makeSale({
      items: [makeSaleItem({ productId: "p1", unitPrice: 20, quantity: 2 })],
      profit: 999,
    });
    expect(getSaleProfit(sale, products)).toBe(20);
  });

  it("venta con items no resolubles usa el profit congelado", () => {
    const sale = makeSale({
      items: [makeSaleItem({ productId: "borrado", unitPrice: 20, quantity: 2 })],
      profit: 15,
    });
    expect(getSaleProfit(sale, [])).toBe(15);
  });

  it("venta legacy single-product = ingreso - costo", () => {
    const products = [makeProduct({ id: "p1", supplierPrice: 10, unitsPerPackage: 1 })];
    const sale = makeSale({
      items: [],
      productId: "p1",
      quantity: 3,
      totalAmount: 60,
    });
    // ingreso 60 - costo (10 * 3) = 30
    expect(getSaleProfit(sale, products)).toBe(30);
  });

  it("venta legacy single-product con producto borrado devuelve sale.profit", () => {
    const sale = makeSale({ items: [], productId: "p1", quantity: 3, profit: 7 });
    expect(getSaleProfit(sale, [])).toBe(7);
  });
});

describe("calculatePendingDebt", () => {
  it("suma las ventas pendientes del cliente y respeta totalPagado", () => {
    const sales = [
      makeSale({ id: "a", clientId: "c1", isPaid: false, totalAmount: 100, date: 2 }),
      makeSale({ id: "b", clientId: "c1", isPaid: false, totalAmount: 50, date: 1 }),
      makeSale({ id: "c", clientId: "c1", isPaid: true, totalAmount: 999 }),
      makeSale({ id: "d", clientId: "otro", isPaid: false, totalAmount: 999 }),
    ];
    const clients = [makeClient({ id: "c1", totalPagado: 30 })];
    const info = calculatePendingDebt("c1", sales, clients, []);

    expect(info.totalDebt).toBe(150);
    expect(info.totalPaid).toBe(30);
    expect(info.remainingDebt).toBe(120);
    expect(info.isFullyPaid).toBe(false);
    expect(info.pendingSales.map((s) => s.id)).toEqual(["b", "a"]);
  });

  it("remainingDebt nunca es negativo y isFullyPaid es true si se pagó de más", () => {
    const sales = [makeSale({ clientId: "c1", isPaid: false, totalAmount: 40 })];
    const clients = [makeClient({ id: "c1", totalPagado: 100 })];
    const info = calculatePendingDebt("c1", sales, clients, []);
    expect(info.remainingDebt).toBe(0);
    expect(info.isFullyPaid).toBe(true);
  });

  it("filtra los pagos por cliente", () => {
    const info = calculatePendingDebt(
      "c1",
      [],
      [makeClient({ id: "c1" })],
      [makePayment({ clientId: "c1" }), makePayment({ id: "x", clientId: "otro" })]
    );
    expect(info.payments).toHaveLength(1);
  });
});

describe("getDateRange", () => {
  afterEach(() => vi.useRealTimers());

  it("CUSTOM devuelve el rango tal cual", () => {
    expect(getDateRange({ type: "CUSTOM", startDate: 100, endDate: 200 })).toEqual({
      start: 100,
      end: 200,
    });
  });

  it("DAILY cubre el día completo anclado en startDate", () => {
    const anchor = new Date("2026-03-10T15:30:00").getTime();
    const { start, end } = getDateRange({ type: "DAILY", startDate: anchor });
    expect(new Date(start).getHours()).toBe(0);
    expect(new Date(start).getDate()).toBe(10);
    expect(new Date(end).getHours()).toBe(23);
    expect(new Date(end).getDate()).toBe(10);
  });

  it("WEEKLY va de lunes a domingo", () => {
    // 2026-03-11 es miércoles
    const anchor = new Date("2026-03-11T10:00:00").getTime();
    const { start, end } = getDateRange({ type: "WEEKLY", startDate: anchor });
    expect(new Date(start).getDay()).toBe(1); // lunes
    expect(new Date(end).getDay()).toBe(0); // domingo
    expect(new Date(start).getDate()).toBe(9);
    expect(new Date(end).getDate()).toBe(15);
  });

  it("MONTHLY (default) cubre primer y último día del mes", () => {
    const anchor = new Date("2026-02-15T10:00:00").getTime();
    const { start, end } = getDateRange({ type: "MONTHLY", startDate: anchor });
    expect(new Date(start).getDate()).toBe(1);
    expect(new Date(start).getMonth()).toBe(1);
    expect(new Date(end).getDate()).toBe(28); // 2026 no es bisiesto
  });
});

describe("getExpenseMillis", () => {
  it("normaliza date en string a número", () => {
    expect(getExpenseMillis(makeExpense({ date: "1700000000000" }))).toBe(1700000000000);
  });
});

describe("buildDashboardSummary", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-20T12:00:00Z"));
    setActiveFormatConfig({ locale: "es-CO", currency: "COP" });
  });
  afterEach(() => vi.useRealTimers());

  it("sólo cuenta ventas pagadas para el ingreso", () => {
    const sales = [
      makeSale({ isPaid: true, totalAmount: 100 }),
      makeSale({ isPaid: false, totalAmount: 999 }),
    ];
    const summary = buildDashboardSummary(sales, [], [], []);
    expect(summary.totalIncome).toBe(100);
  });

  it("netProfit = utilidad de ventas pagadas - gastos", () => {
    const products = [makeProduct({ id: "p1", supplierPrice: 10, unitsPerPackage: 1 })];
    const sales = [
      makeSale({
        isPaid: true,
        totalAmount: 40,
        items: [makeSaleItem({ productId: "p1", unitPrice: 20, quantity: 2 })],
      }),
    ];
    const expenses = [makeExpense({ amount: 5 })];
    const summary = buildDashboardSummary(sales, expenses, products, []);
    // utilidad = (20-10)*2 = 20 ; net = 20 - 5 = 15
    expect(summary.netProfit).toBe(15);
    expect(summary.totalExpenses).toBe(5);
  });

  it("lowStockAlerts incluye productos con stock <= minStock", () => {
    const products = [
      makeProduct({ id: "ok", stock: 100, minStock: 5 }),
      makeProduct({ id: "low", stock: 3, minStock: 5 }),
    ];
    const summary = buildDashboardSummary([], [], products, []);
    expect(summary.lowStockAlerts.map((p) => p.id)).toEqual(["low"]);
  });

  it("chartData tiene 7 entradas", () => {
    const summary = buildDashboardSummary([], [], [], []);
    expect(summary.chartData).toHaveLength(7);
  });

  it("totalDebt usa client.deuda o el fallback de ventas impagas", () => {
    const clients = [
      makeClient({ id: "c1", deuda: 200 }),
      makeClient({ id: "c2", deuda: 0 }),
    ];
    const sales = [makeSale({ clientId: "c2", isPaid: false, totalAmount: 75 })];
    const summary = buildDashboardSummary(sales, [], [], clients);
    expect(summary.totalDebt).toBe(275);
  });
});

describe("buildDashboardDeltas", () => {
  const now = Date.parse("2026-06-15T00:00:00Z");
  const day = 24 * 60 * 60 * 1000;

  it("incomePct null cuando no hay base previa", () => {
    const sales = [makeSale({ isPaid: true, totalAmount: 100, date: now - day })];
    const deltas = buildDashboardDeltas(sales, [], [], [], now);
    expect(deltas.incomePct).toBeNull();
  });

  it("calcula la variación porcentual de ingresos", () => {
    const sales = [
      makeSale({ id: "prev", isPaid: true, totalAmount: 100, date: now - 45 * day }),
      makeSale({ id: "cur", isPaid: true, totalAmount: 150, date: now - 5 * day }),
    ];
    const deltas = buildDashboardDeltas(sales, [], [], [], now);
    expect(deltas.incomePct).toBeCloseTo(50);
  });

  it("clientsWithDebt cuenta clientes con deuda efectiva > 0", () => {
    const clients = [
      makeClient({ id: "c1", deuda: 10 }),
      makeClient({ id: "c2", deuda: 0 }),
    ];
    const deltas = buildDashboardDeltas([], [], [], clients, now);
    expect(deltas.clientsWithDebt).toBe(1);
  });

  it("profitMarginPct es 0 sin ingresos", () => {
    const deltas = buildDashboardDeltas([], [], [], [], now);
    expect(deltas.profitMarginPct).toBe(0);
  });
});

describe("calculateProductFinancials", () => {
  it("calcula costo, ganancia y márgenes por unidad y paquete", () => {
    const product = makeProduct({
      supplierPrice: 120,
      unitsPerPackage: 12,
      salePrice: 20,
      saleBasketPrice: null,
      stock: 10,
    });
    const fin = calculateProductFinancials(product);
    expect(fin.costoUnidad).toBe(10);
    expect(fin.gananciaUnidad).toBe(10);
    expect(fin.margenUnidad).toBe(50);
    expect(fin.ventaPaquete).toBe(240); // salePrice * uxp
    expect(fin.valorProveedor).toBe(100);
    expect(fin.valorVenta).toBe(200);
    expect(fin.gananciaPotencial).toBe(100);
  });

  it("clamp de unitsPerPackage a 1 y sin division por cero", () => {
    const fin = calculateProductFinancials(
      makeProduct({ unitsPerPackage: 0, supplierPrice: 10, salePrice: 0 })
    );
    expect(Number.isFinite(fin.costoUnidad)).toBe(true);
    expect(fin.margenUnidad).toBe(0);
  });
});

describe("buildReport", () => {
  const range = { type: "CUSTOM" as const, startDate: 0, endDate: Date.parse("2027-01-01") };

  it("suma sólo ventas pagadas dentro del rango", () => {
    const sales = [
      makeSale({ isPaid: true, totalAmount: 100, date: 1000 }),
      makeSale({ isPaid: false, totalAmount: 500, date: 1000 }),
      makeSale({ isPaid: true, totalAmount: 999, date: Date.parse("2030-01-01") }),
    ];
    const report = buildReport(range, sales, [], [], [], []);
    expect(report.totalSales).toBe(100);
  });

  it("agrupa ventas por mesa y por producto", () => {
    const sales = [
      makeSale({
        isPaid: true,
        tableId: "t1",
        totalAmount: 80,
        date: 1000,
        items: [makeSaleItem({ productId: "p1", productName: "Cerveza", totalPrice: 80, quantity: 4 })],
      }),
    ];
    const report = buildReport(range, sales, [], [], [], [{ id: "t1", name: "Mesa 1" }]);
    expect(report.salesByTable["Mesa 1"]).toBe(80);
    expect(report.salesByProduct["Cerveza"]).toBe(80);
    expect(report.topProducts[0]).toEqual({ name: "Cerveza", quantity: 4 });
  });
});

describe("calculateGameTotal", () => {
  it("precio de partida + suma de apuestas", () => {
    const game = makeGame({
      pricePerGame: 30,
      bets: [makeBet({ totalPrice: 20 }), makeBet({ totalPrice: 10 })],
    });
    expect(calculateGameTotal(game)).toBe(60);
  });
});

describe("prepareGameSales", () => {
  afterEach(() => vi.useRealTimers());

  it("devuelve [] cuando el total es 0", () => {
    expect(prepareGameSales(makeGame(), [])).toEqual([]);
  });

  it("reparte el total entre los perdedores", () => {
    const game = makeGame({
      pricePerGame: 100,
      loserIds: ["c1", "c2"],
      participants: [makeParticipant({ clientId: "c1" }), makeParticipant({ clientId: "c2" })],
    });
    const sales = prepareGameSales(game, [], "actor-1");
    expect(sales).toHaveLength(2);
    expect(sales[0].totalAmount).toBe(50);
    expect(sales[0].clientId).toBe("c1");
    expect(sales[0].sellerId).toBe("actor-1");
    expect(sales.every((s) => s.isGameSale && s.type === "TABLE")).toBe(true);
  });

  it("usa los participantes cuando no hay perdedores", () => {
    const game = makeGame({
      pricePerGame: 90,
      participants: [
        makeParticipant({ clientId: "a" }),
        makeParticipant({ clientId: "b" }),
        makeParticipant({ clientId: "c" }),
      ],
    });
    const sales = prepareGameSales(game, []);
    expect(sales.map((s) => s.clientId)).toEqual(["a", "b", "c"]);
    expect(sales[0].totalAmount).toBe(30);
  });

  it("reparte las cantidades de las apuestas distribuyendo el residuo", () => {
    const game = makeGame({
      pricePerGame: 0,
      loserIds: ["c1", "c2"],
      bets: [makeBet({ productId: "p1", quantity: 3, unitPrice: 10, totalPrice: 30 })],
    });
    const sales = prepareGameSales(game, []);
    const quantities = sales.map((s) => s.items[0].quantity);
    expect(quantities).toEqual([2, 1]);
  });

  it("sin destinatarios genera una venta con clientId vacío", () => {
    const game = makeGame({ pricePerGame: 40 });
    const sales = prepareGameSales(game, []);
    expect(sales).toHaveLength(1);
    expect(sales[0].clientId).toBe("");
    expect(sales[0].totalAmount).toBe(40);
  });
});
