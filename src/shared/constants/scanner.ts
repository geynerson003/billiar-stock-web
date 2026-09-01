/**
 * Catálogo de modos de lectura de código de barras. Sigue el mismo patrón
 * "catálogo tipado + resolutor con fallback" de `markets.ts`/`countries.ts`,
 * pero la preferencia elegida se guarda en `localStorage` (por dispositivo,
 * ver `src/shared/hooks/use-scanner-mode.ts`), no en el perfil de Firestore:
 * cámara vs. lector físico depende del hardware de cada dispositivo, no de
 * la cuenta.
 */

export type ScannerModeId = "camera" | "hid";

export interface ScannerModeOption {
  id: ScannerModeId;
  /** Nombre para el selector, ej. "Cámara del celular". */
  name: string;
  /** Ayuda corta mostrada bajo el selector. */
  description: string;
}

export const SCANNER_MODES: ScannerModeOption[] = [
  {
    id: "camera",
    name: "Cámara del celular",
    description: "Usa la cámara del dispositivo para leer el código de barras."
  },
  {
    id: "hid",
    name: "Lector físico externo",
    description:
      "Para lectores USB o Bluetooth tipo pistola: enfoca el campo y escanea, el lector escribe el código y confirma automáticamente."
  }
];

/** Modo por defecto cuando no hay preferencia guardada. */
export const DEFAULT_SCANNER_MODE_ID: ScannerModeId = "camera";

const SCANNER_MODE_BY_ID = new Map(SCANNER_MODES.map((mode) => [mode.id, mode]));

/**
 * Devuelve la configuración del modo indicado. Si el id es nulo o
 * desconocido, cae al modo por defecto.
 */
export function getScannerModeOption(id?: string | null): ScannerModeOption {
  return (
    (id ? SCANNER_MODE_BY_ID.get(id as ScannerModeId) : undefined) ??
    SCANNER_MODE_BY_ID.get(DEFAULT_SCANNER_MODE_ID)!
  );
}

/** True si `id` corresponde a un modo de lectura conocido. */
export function isKnownScannerMode(id?: string | null): id is ScannerModeId {
  return !!id && SCANNER_MODE_BY_ID.has(id as ScannerModeId);
}
