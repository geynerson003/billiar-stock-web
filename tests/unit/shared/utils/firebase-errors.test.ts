import { describe, expect, it } from "vitest";
import { getFirebaseErrorMessage } from "../../../../src/shared/utils/firebase-errors";

describe("getFirebaseErrorMessage", () => {
  it("traduce por la propiedad code (FirebaseError)", () => {
    expect(getFirebaseErrorMessage({ code: "auth/invalid-credential" })).toMatch(
      /correo o la contraseña/i
    );
  });

  it("extrae el código del message entre paréntesis", () => {
    const err = new Error("Firebase: Error (auth/email-already-in-use).");
    expect(getFirebaseErrorMessage(err)).toMatch(/ya existe una cuenta/i);
  });

  it("traduce códigos de Firestore", () => {
    expect(getFirebaseErrorMessage({ code: "permission-denied" })).toMatch(
      /no tienes permisos/i
    );
  });

  it("devuelve el message de un Error genérico no-Firebase", () => {
    expect(getFirebaseErrorMessage(new Error("Algo salió mal a nivel de red"))).toBe(
      "Algo salió mal a nivel de red"
    );
  });

  it("usa el fallback cuando no hay información útil", () => {
    expect(getFirebaseErrorMessage(null, "fallback-x")).toBe("fallback-x");
    expect(getFirebaseErrorMessage({ code: "auth/desconocido" }, "fallback-y")).toBe(
      "fallback-y"
    );
  });
});
