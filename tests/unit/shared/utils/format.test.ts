import { beforeEach, describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatDate,
  formatDuration,
  formatPhone,
  formatShortDate,
  getActiveLocale,
  setActiveFormatConfig,
} from "../../../../src/shared/utils/format";

beforeEach(() => {
  setActiveFormatConfig({ locale: "es-CO", currency: "COP" });
});

describe("setActiveFormatConfig / getActiveLocale", () => {
  it("cambia el locale activo", () => {
    setActiveFormatConfig({ locale: "es-MX", currency: "MXN" });
    expect(getActiveLocale()).toBe("es-MX");
  });
});

describe("formatCurrency", () => {
  it("incluye los dígitos del valor formateado", () => {
    const out = formatCurrency(1234);
    expect(out.replace(/\D/g, "")).toContain("1234");
  });

  it("trata valores no finitos como 0", () => {
    const zero = formatCurrency(0);
    expect(formatCurrency(NaN)).toBe(zero);
    expect(formatCurrency(Infinity)).toBe(zero);
  });
});

describe("formatDate / formatShortDate", () => {
  it("devuelve 'Sin fecha' para valores vacíos o inválidos", () => {
    expect(formatDate(null)).toBe("Sin fecha");
    expect(formatDate(undefined)).toBe("Sin fecha");
    expect(formatDate(0)).toBe("Sin fecha");
    expect(formatShortDate("no-es-numero")).toBe("Sin fecha");
  });

  it("acepta epoch en string", () => {
    const ms = Date.parse("2026-03-15T10:00:00Z");
    expect(formatDate(String(ms))).not.toBe("Sin fecha");
    expect(formatShortDate(ms)).not.toBe("Sin fecha");
  });
});

describe("formatPhone", () => {
  it("recorta y devuelve el teléfono", () => {
    expect(formatPhone("  300 123  ")).toBe("300 123");
  });

  it("devuelve 'Sin telefono' cuando está vacío", () => {
    expect(formatPhone("   ")).toBe("Sin telefono");
  });
});

describe("formatDuration", () => {
  it("formatea mm:ss", () => {
    expect(formatDuration(65_000)).toBe("01:05");
  });

  it("formatea hh:mm:ss cuando supera una hora", () => {
    expect(formatDuration(3_661_000)).toBe("01:01:01");
  });

  it("nunca es negativo", () => {
    expect(formatDuration(-5000)).toBe("00:00");
  });
});
