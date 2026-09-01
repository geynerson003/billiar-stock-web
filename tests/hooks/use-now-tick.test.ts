import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useNowTick } from "../../src/shared/hooks/use-now-tick";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
});
afterEach(() => {
  vi.useRealTimers();
});

describe("useNowTick", () => {
  it("devuelve el tiempo inicial y avanza cada intervalMs", () => {
    const { result } = renderHook(() => useNowTick(1000));
    const initial = result.current;

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(initial + 1000);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current).toBe(initial + 4000);
  });
});
