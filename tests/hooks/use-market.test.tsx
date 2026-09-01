import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

const useAuthMock = vi.fn();
vi.mock("../../src/shared/hooks/use-auth", () => ({
  useAuth: () => useAuthMock(),
}));

import { useMarket } from "../../src/shared/hooks/use-market";

describe("useMarket", () => {
  it("resuelve el mercado desde profile.market", () => {
    useAuthMock.mockReturnValue({ profile: { market: "bar" } });
    const { result } = renderHook(() => useMarket());
    expect(result.current.id).toBe("bar");
  });

  it("cae al mercado por defecto si no hay market", () => {
    useAuthMock.mockReturnValue({ profile: null });
    const { result } = renderHook(() => useMarket());
    expect(result.current.id).toBe("store");
  });
});
