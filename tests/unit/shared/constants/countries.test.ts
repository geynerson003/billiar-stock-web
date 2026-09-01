import { describe, expect, it } from "vitest";
import {
  DEFAULT_COUNTRY_CODE,
  LATAM_COUNTRIES,
  getCountryOption,
} from "../../../../src/shared/constants/countries";

describe("getCountryOption", () => {
  it("devuelve el país por código", () => {
    expect(getCountryOption("MX").currency).toBe("MXN");
  });
  it("cae a Colombia para código nulo o desconocido", () => {
    expect(getCountryOption(null).code).toBe(DEFAULT_COUNTRY_CODE);
    expect(getCountryOption("ZZ").code).toBe(DEFAULT_COUNTRY_CODE);
  });
});

describe("catálogo LATAM_COUNTRIES", () => {
  it("todos tienen currency y locale no vacíos y código único", () => {
    const codes = new Set<string>();
    for (const c of LATAM_COUNTRIES) {
      expect(c.currency).toBeTruthy();
      expect(c.locale).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
      expect(codes.has(c.code)).toBe(false);
      codes.add(c.code);
    }
  });
});
