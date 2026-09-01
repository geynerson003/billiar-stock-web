import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

const useAuthMock = vi.fn();
vi.mock("../../src/shared/hooks/use-auth", () => ({
  useAuth: () => useAuthMock(),
}));

import { usePermissions } from "../../src/shared/hooks/use-permissions";

function authState(over: Partial<ReturnType<typeof baseState>> = {}) {
  return { ...baseState(), ...over };
}
function baseState() {
  return {
    role: "employee" as "admin" | "employee",
    permissions: [] as string[],
    isEmployee: true,
    profile: { isActive: true } as { isActive?: boolean } | null,
  };
}

describe("usePermissions", () => {
  it("el admin siempre puede", () => {
    useAuthMock.mockReturnValue(authState({ role: "admin", isEmployee: false }));
    const { result } = renderHook(() => usePermissions());
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.can("sales.delete")).toBe(true);
  });

  it("empleado inactivo no puede nada", () => {
    useAuthMock.mockReturnValue(
      authState({ permissions: ["sales.create"], profile: { isActive: false } })
    );
    const { result } = renderHook(() => usePermissions());
    expect(result.current.can("sales.create")).toBe(false);
  });

  it("empleado activo puede según sus permisos", () => {
    useAuthMock.mockReturnValue(authState({ permissions: ["sales.create", "clients.view"] }));
    const { result } = renderHook(() => usePermissions());
    expect(result.current.can("sales.create")).toBe(true);
    expect(result.current.can("sales.delete")).toBe(false);
  });

  it("can([...]) basta con tener uno de la lista", () => {
    useAuthMock.mockReturnValue(authState({ permissions: ["reports.view"] }));
    const { result } = renderHook(() => usePermissions());
    expect(result.current.can(["inventory.edit", "reports.view"])).toBe(true);
    expect(result.current.can(["inventory.edit", "inventory.delete"])).toBe(false);
  });
});
