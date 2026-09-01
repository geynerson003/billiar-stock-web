import { describe, expect, it } from "vitest";
import {
  DEFAULT_MARKET_ID,
  MARKETS,
  getMarketOption,
  isKnownMarket,
} from "../../../../src/shared/constants/markets";

describe("getMarketOption", () => {
  it("devuelve el mercado por id", () => {
    expect(getMarketOption("bar").id).toBe("bar");
  });
  it("cae al default para id nulo o desconocido", () => {
    expect(getMarketOption(null).id).toBe(DEFAULT_MARKET_ID);
    expect(getMarketOption("xxx").id).toBe(DEFAULT_MARKET_ID);
  });
});

describe("isKnownMarket", () => {
  it("true para ids del catálogo, false para el resto", () => {
    expect(isKnownMarket("restaurant")).toBe(true);
    expect(isKnownMarket("nope")).toBe(false);
    expect(isKnownMarket(null)).toBe(false);
  });
});

describe("catálogo MARKETS", () => {
  it("contiene los 4 mercados esperados", () => {
    expect(MARKETS.map((m) => m.id).sort()).toEqual(
      ["bar", "billiards", "restaurant", "store"].sort()
    );
  });
  it("sólo 'store' oculta la sección de mesas", () => {
    const withoutTables = MARKETS.filter((m) => !m.features.tables).map((m) => m.id);
    expect(withoutTables).toEqual(["store"]);
  });
  it("todos los términos requeridos están presentes y no vacíos para billiards", () => {
    const billiards = getMarketOption("billiards");
    expect(billiards.terms.sessionNoun).toBe("partida");
  });
});
