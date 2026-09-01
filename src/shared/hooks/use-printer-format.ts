/**
 * Preferencia de formato de papel para la impresión de facturas (térmica
 * 80/58 mm, A4, Carta). Persiste en localStorage por dispositivo, igual que
 * `useScannerMode` / `useTheme` — no se sincroniza vía Firestore/perfil porque
 * la impresora disponible depende de cada local, no de la cuenta.
 */

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_PRINTER_FORMAT_ID,
  isKnownPrinterFormat,
  type PrinterFormatId
} from "../constants/printer";

const STORAGE_KEY = "mi-negocio-printer-format";

function readStoredPrinterFormat(): PrinterFormatId {
  if (typeof window === "undefined") return DEFAULT_PRINTER_FORMAT_ID;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isKnownPrinterFormat(stored) ? stored : DEFAULT_PRINTER_FORMAT_ID;
}

export function usePrinterFormat() {
  const [printerFormat, setPrinterFormatState] = useState<PrinterFormatId>(
    readStoredPrinterFormat
  );

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, printerFormat);
  }, [printerFormat]);

  const setPrinterFormat = useCallback((format: PrinterFormatId) => {
    setPrinterFormatState(format);
  }, []);

  return { printerFormat, setPrinterFormat };
}
