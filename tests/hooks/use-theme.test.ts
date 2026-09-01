import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useTheme } from "../../src/shared/hooks/use-theme";

const KEY = "mi-negocio-theme";

beforeEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
});
afterEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe("useTheme", () => {
  it("por defecto es light", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
    expect(result.current.isDark).toBe(false);
  });

  it("toggleTheme alterna, persiste y aplica data-theme", () => {
    const { result } = renderHook(() => useTheme());

    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe("dark");
    expect(result.current.isDark).toBe(true);
    expect(window.localStorage.getItem(KEY)).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");

    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe("light");
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it("lee la preferencia guardada al montar", () => {
    window.localStorage.setItem(KEY, "dark");
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("dark");
  });
});
