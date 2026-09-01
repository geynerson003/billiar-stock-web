import { describe, expect, it } from "vitest";
import {
  calculateProductMetrics,
  computeSaleLineItem,
} from "../../../../src/shared/services/firebase/business.service";
import { makeProduct } from "../../../helpers/factories";

describe("computeSaleLineItem", () => {
  it("venta por unidad usa salePrice", () => {
    const line = computeSaleLineItem(
      makeProduct({ id: "p1", name: "Cerveza", salePrice: 25 }),
      3,
      false
    );
    expect(line).toEqual({
      productId: "p1",
      productName: "Cerveza",
      quantity: 3,
      unitPrice: 25,
      totalPrice: 75,
      saleByBasket: false,
    });
  });

  it("venta por canasta usa saleBasketPrice, o 0 si es null", () => {
    const withBasket = computeSaleLineItem(
      makeProduct({ saleBasketPrice: 200 }),
      2,
      true
    );
    expect(withBasket.unitPrice).toBe(200);
    expect(withBasket.totalPrice).toBe(400);

    const noBasket = computeSaleLineItem(makeProduct({ saleBasketPrice: null }), 2, true);
    expect(noBasket.unitPrice).toBe(0);
    expect(noBasket.totalPrice).toBe(0);
  });
});

describe("calculateProductMetrics", () => {
  it("costo por unidad y utilidad por unidad", () => {
    const metrics = calculateProductMetrics(
      makeProduct({ supplierPrice: 120, unitsPerPackage: 12, salePrice: 20 })
    );
    expect(metrics.supplierPerUnit).toBe(10);
    expect(metrics.profitPerUnit).toBe(10);
  });
});
