/**
 * Preferencia de modo de lectura de código de barras (cámara vs. lector
 * físico externo). Persiste en localStorage por dispositivo, igual que
 * `useTheme` — no se sincroniza vía Firestore/perfil porque el hardware
 * disponible depende de cada dispositivo, no de la cuenta.
 */

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_SCANNER_MODE_ID, isKnownScannerMode, type ScannerModeId } from "../constants/scanner";

const STORAGE_KEY = "mi-negocio-scanner-mode";

function readStoredScannerMode(): ScannerModeId {
  if (typeof window === "undefined") return DEFAULT_SCANNER_MODE_ID;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isKnownScannerMode(stored) ? stored : DEFAULT_SCANNER_MODE_ID;
}

export function useScannerMode() {
  const [scannerMode, setScannerModeState] = useState<ScannerModeId>(readStoredScannerMode);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, scannerMode);
  }, [scannerMode]);

  const setScannerMode = useCallback((mode: ScannerModeId) => {
    setScannerModeState(mode);
  }, []);

  return { scannerMode, setScannerMode };
}
