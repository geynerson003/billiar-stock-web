import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// El módulo de configuración de Firebase hace `initializeApp` / `getAuth` /
// `getFirestore` como efecto colateral al importarse. Los tests de esta suite
// sólo ejercitan lógica pura (mappers, helpers), así que lo reemplazamos por
// stubs para no arrancar el SDK real ni tocar la red.
vi.mock("../src/shared/services/firebase/config", () => ({
  firebaseConfig: {},
  firebaseApp: {},
  auth: {},
  db: {},
}));

afterEach(() => {
  cleanup();
});
