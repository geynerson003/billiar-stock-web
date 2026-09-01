import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useScannerMode } from "../../src/shared/hooks/use-scanner-mode";

const KEY = "mi-negocio-scanner-mode";

beforeEach(() => window.localStorage.clear());
afterEach(() => window.localStorage.clear());

describe("useScannerMode", () => {
  it("por defecto es 'camera'", () => {
    const { result } = renderHook(() => useScannerMode());
    expect(result.current.scannerMode).toBe("camera");
  });

  it("setScannerMode actualiza y persiste", () => {
    const { result } = renderHook(() => useScannerMode());
    act(() => result.current.setScannerMode("hid"));
    expect(result.current.scannerMode).toBe("hid");
    expect(window.localStorage.getItem(KEY)).toBe("hid");
  });

  it("ignora un valor guardado inválido", () => {
    window.localStorage.setItem(KEY, "laser");
    const { result } = renderHook(() => useScannerMode());
    expect(result.current.scannerMode).toBe("camera");
  });
});
