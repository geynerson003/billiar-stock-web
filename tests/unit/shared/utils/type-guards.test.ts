import { describe, expect, it } from "vitest";
import {
  isArray,
  isObject,
  toBoolean,
  toMillis,
  toNullableText,
  toNumber,
  toText,
} from "../../../../src/shared/utils/type-guards";

describe("toNumber", () => {
  it("devuelve números finitos tal cual", () => {
    expect(toNumber(42)).toBe(42);
  });
  it("parsea strings numéricas", () => {
    expect(toNumber("3.5")).toBe(3.5);
  });
  it("usa el fallback para valores no parseables", () => {
    expect(toNumber("abc", 9)).toBe(9);
    expect(toNumber(NaN, 9)).toBe(9);
    expect(toNumber(null, 9)).toBe(9);
  });
});

describe("toText", () => {
  it("devuelve strings tal cual", () => {
    expect(toText("hola")).toBe("hola");
  });
  it("usa el fallback para null/undefined", () => {
    expect(toText(null, "x")).toBe("x");
    expect(toText(undefined, "x")).toBe("x");
  });
  it("convierte otros valores con String()", () => {
    expect(toText(12)).toBe("12");
  });
});

describe("toNullableText", () => {
  it("devuelve null para strings vacías o con sólo espacios", () => {
    expect(toNullableText("   ")).toBeNull();
    expect(toNullableText(null)).toBeNull();
  });
  it("recorta el texto", () => {
    expect(toNullableText("  hey  ")).toBe("hey");
  });
});

describe("toBoolean", () => {
  it("booleanos tal cual", () => {
    expect(toBoolean(true)).toBe(true);
  });
  it("números: 0 es false, resto true", () => {
    expect(toBoolean(0)).toBe(false);
    expect(toBoolean(1)).toBe(true);
  });
  it("strings 'true'/'false' case-insensitive", () => {
    expect(toBoolean("TRUE")).toBe(true);
    expect(toBoolean("False")).toBe(false);
  });
  it("fallback para lo demás", () => {
    expect(toBoolean("maybe", true)).toBe(true);
  });
});

describe("toMillis", () => {
  it("números finitos tal cual", () => {
    expect(toMillis(1700000000000)).toBe(1700000000000);
  });
  it("strings numéricas via parseInt", () => {
    expect(toMillis("1700000000000")).toBe(1700000000000);
  });
  it("objetos con toMillis()", () => {
    expect(toMillis({ toMillis: () => 123 })).toBe(123);
  });
  it("fallback si no se puede convertir", () => {
    expect(toMillis(null, 7)).toBe(7);
  });
});

describe("isArray / isObject", () => {
  it("isArray", () => {
    expect(isArray([])).toBe(true);
    expect(isArray({})).toBe(false);
  });
  it("isObject excluye null y arrays", () => {
    expect(isObject({})).toBe(true);
    expect(isObject(null)).toBe(false);
    expect(isObject([])).toBe(false);
  });
});
