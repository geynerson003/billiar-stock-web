import { describe, expect, it } from "vitest";
import {
  mapClient,
  mapEmployee,
  mapExpense,
  mapGame,
  mapPayment,
  mapProduct,
  mapSale,
  mapTable,
  mapTableSession,
} from "../../../../src/shared/services/firebase/business.service";
import { fakeSnapshot } from "../../../helpers/factories";

describe("mapProduct", () => {
  it("coacciona strings numéricas y clampa unitsPerPackage a >= 1", () => {
    const p = mapProduct(
      fakeSnapshot("p1", {
        name: "Cerveza",
        stock: "42",
        supplierPrice: "10.5",
        salePrice: "20",
        minStock: "3",
        unitsPerPackage: 0,
        saleBasketPrice: undefined,
        barcode: "  ",
      })
    );
    expect(p.id).toBe("p1");
    expect(p.stock).toBe(42);
    expect(p.supplierPrice).toBe(10.5);
    expect(p.unitsPerPackage).toBe(1);
    expect(p.saleBasketPrice).toBeNull();
    expect(p.barcode).toBeNull();
  });
});

describe("mapClient", () => {
  it("normaliza los campos de deuda", () => {
    const c = mapClient(
      fakeSnapshot("c1", { nombre: "Ana", deuda: "100", deudaOriginal: 100, totalPagado: "0" })
    );
    expect(c).toMatchObject({ id: "c1", nombre: "Ana", deuda: 100, totalPagado: 0 });
  });
});

describe("mapExpense", () => {
  it("date siempre queda como string y createdBy vacío es undefined", () => {
    const e = mapExpense(fakeSnapshot("e1", { amount: "12.5", date: 1700000000000, createdBy: "  " }));
    expect(e.amount).toBe(12.5);
    expect(typeof e.date).toBe("string");
    expect(e.createdBy).toBeUndefined();
  });
});

describe("mapPayment", () => {
  it("normaliza amount y date", () => {
    const p = mapPayment(fakeSnapshot("pay1", { amount: "50", date: "1700000000000", clientId: "c1" }));
    expect(p.amount).toBe(50);
    expect(p.date).toBe(1700000000000);
  });
});

describe("mapTable", () => {
  it("pricingMode sólo puede ser TIME o GAME", () => {
    expect(mapTable(fakeSnapshot("t1", { pricingMode: "TIME" })).pricingMode).toBe("TIME");
    expect(mapTable(fakeSnapshot("t2", { pricingMode: "raro" })).pricingMode).toBe("GAME");
  });
});

describe("mapTableSession", () => {
  it("normaliza sales[] y endTime null", () => {
    const s = mapTableSession(
      fakeSnapshot("sess1", { tableId: "t1", startTime: 1000, endTime: 0, sales: ["a", 2], total: "5" })
    );
    expect(s.sales).toEqual(["a", "2"]);
    expect(s.endTime).toBeNull();
    expect(s.total).toBe(5);
  });
});

describe("mapSale", () => {
  it("respeta la bandera legacy 'paid' cuando falta isPaid", () => {
    const s = mapSale(fakeSnapshot("s1", { paid: true, totalAmount: "100", type: "TABLE" }));
    expect(s.isPaid).toBe(true);
    expect(s.totalAmount).toBe(100);
    expect(s.type).toBe("TABLE");
  });

  it("isPaid explícito en false gana sobre cualquier legacy", () => {
    const s = mapSale(fakeSnapshot("s3", { isPaid: false, paid: true }));
    expect(s.isPaid).toBe(false);
  });

  it("documento sin ninguna bandera de pago se mapea como no pagado", () => {
    expect(mapSale(fakeSnapshot("s4", {})).isPaid).toBe(false);
  });

  it("type inválido cae a EXTERNAL y items se normalizan", () => {
    const s = mapSale(
      fakeSnapshot("s2", {
        type: "???",
        items: [{ productId: "p1", productName: "X", quantity: "2", unitPrice: "10", totalPrice: "20" }],
      })
    );
    expect(s.type).toBe("EXTERNAL");
    expect(s.items[0]).toMatchObject({ quantity: 2, unitPrice: 10, totalPrice: 20, saleByBasket: false });
  });
});

describe("mapGame", () => {
  it("normaliza status, arrays anidados y timerDurationMs", () => {
    const g = mapGame(
      fakeSnapshot("g1", {
        tableId: "t1",
        status: "PAUSED",
        participants: [{ clientId: "c1", clientName: "Ana", joinedAt: 1000 }],
        bets: [{ productId: "p1", productName: "X", quantity: "1", unitPrice: "5", totalPrice: "5", betByClientIds: ["c1"] }],
        loserIds: ["c1", 2],
        timerDurationMs: undefined,
      })
    );
    expect(g.status).toBe("ACTIVE");
    expect(g.participants[0].clientName).toBe("Ana");
    expect(g.bets[0].quantity).toBe(1);
    expect(g.loserIds).toEqual(["c1", "2"]);
    expect(g.timerDurationMs).toBeNull();
  });
});

describe("mapEmployee", () => {
  it("displayName cae a loginName y credV mínimo 1", () => {
    const e = mapEmployee(
      fakeSnapshot("emp1", { loginName: "ana", displayName: "", credV: 0, isActive: undefined })
    );
    expect(e.displayName).toBe("ana");
    expect(e.credV).toBe(1);
    expect(e.isActive).toBe(true);
  });
});
