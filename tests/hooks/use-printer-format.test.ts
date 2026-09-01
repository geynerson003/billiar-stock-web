import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { usePrinterFormat } from "../../src/shared/hooks/use-printer-format";

const KEY = "mi-negocio-printer-format";

beforeEach(() => window.localStorage.clear());
afterEach(() => window.localStorage.clear());

describe("usePrinterFormat", () => {
  it("por defecto es 'thermal-80'", () => {
    const { result } = renderHook(() => usePrinterFormat());
    expect(result.current.printerFormat).toBe("thermal-80");
  });

  it("setPrinterFormat actualiza y persiste", () => {
    const { result } = renderHook(() => usePrinterFormat());
    act(() => result.current.setPrinterFormat("a4"));
    expect(result.current.printerFormat).toBe("a4");
    expect(window.localStorage.getItem(KEY)).toBe("a4");
  });

  it("ignora un valor guardado inválido", () => {
    window.localStorage.setItem(KEY, "thermal-1");
    const { result } = renderHook(() => usePrinterFormat());
    expect(result.current.printerFormat).toBe("thermal-80");
  });
});
