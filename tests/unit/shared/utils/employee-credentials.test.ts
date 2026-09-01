import { describe, expect, it } from "vitest";
import {
  EMPLOYEE_EMAIL_DOMAIN,
  buildSyntheticEmail,
  employeeLookupId,
  normalizeBusinessCode,
  slugifyLoginName,
} from "../../../../src/shared/utils/employee-credentials";

describe("slugifyLoginName", () => {
  it("quita acentos, pasa a minúsculas y colapsa símbolos a '-'", () => {
    expect(slugifyLoginName("José  Pérez!!")).toBe("jose-perez");
  });
  it("recorta guiones de los extremos", () => {
    expect(slugifyLoginName("  --Ana--  ")).toBe("ana");
  });
});

describe("normalizeBusinessCode", () => {
  it("recorta, pasa a mayúsculas y quita espacios internos", () => {
    expect(normalizeBusinessCode("  ab cd 23 ")).toBe("ABCD23");
  });
});

describe("buildSyntheticEmail", () => {
  it("construye el email sintético con el patrón esperado", () => {
    expect(buildSyntheticEmail("ana", "ABC234", 2)).toBe(
      `ana--v2--abc234@${EMPLOYEE_EMAIL_DOMAIN}`
    );
  });
});

describe("employeeLookupId", () => {
  it("es determinista para la misma entrada", async () => {
    const a = await employeeLookupId("ABC234", "ana");
    const b = await employeeLookupId(" abc234 ", "ana");
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("cambia si cambia el nombre", async () => {
    const a = await employeeLookupId("ABC234", "ana");
    const c = await employeeLookupId("ABC234", "luis");
    expect(a).not.toBe(c);
  });
});
