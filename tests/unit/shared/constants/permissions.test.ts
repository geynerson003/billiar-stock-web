import { describe, expect, it } from "vitest";
import {
  ALL_ASSIGNABLE,
  PERMISSION_GROUPS,
  ROLE_PRESETS,
  getRolePreset,
  isKnownPermission,
  sanitizePermissions,
} from "../../../../src/shared/constants/permissions";

describe("isKnownPermission / sanitizePermissions", () => {
  it("reconoce permisos válidos", () => {
    expect(isKnownPermission("sales.create")).toBe(true);
    expect(isKnownPermission("employees.manage")).toBe(false);
  });
  it("sanitizePermissions filtra los desconocidos", () => {
    expect(sanitizePermissions(["sales.create", "basura", "reports.view"])).toEqual([
      "sales.create",
      "reports.view",
    ]);
  });
});

describe("getRolePreset", () => {
  it("devuelve el preset por id", () => {
    expect(getRolePreset("vendedor").id).toBe("vendedor");
  });
  it("cae a 'custom' para id desconocido o nulo", () => {
    expect(getRolePreset(null).id).toBe("custom");
    expect(getRolePreset("xxx").id).toBe("custom");
  });
});

describe("invariantes del catálogo", () => {
  it("ALL_ASSIGNABLE es la lista aplanada de PERMISSION_GROUPS sin duplicados", () => {
    const flat = PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => i.id));
    expect(ALL_ASSIGNABLE).toEqual(flat);
    expect(new Set(ALL_ASSIGNABLE).size).toBe(ALL_ASSIGNABLE.length);
  });

  it("el preset 'vendedor' es un subconjunto de ALL_ASSIGNABLE", () => {
    const vendedor = ROLE_PRESETS.find((p) => p.id === "vendedor")!;
    for (const perm of vendedor.permissions) {
      expect(ALL_ASSIGNABLE).toContain(perm);
    }
  });

  it("el preset 'encargado' incluye todos los permisos asignables", () => {
    const encargado = ROLE_PRESETS.find((p) => p.id === "encargado")!;
    expect([...encargado.permissions].sort()).toEqual([...ALL_ASSIGNABLE].sort());
  });
});
