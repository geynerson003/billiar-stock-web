/**
 * Catálogo de formatos de papel para la impresión de facturas. Sigue el mismo
 * patrón "catálogo tipado + resolutor con fallback" de `scanner.ts`, y —igual
 * que el modo de escáner— la preferencia elegida se guarda en `localStorage`
 * (por dispositivo, ver `src/shared/hooks/use-printer-format.ts`), no en el
 * perfil de Firestore: la impresora depende del hardware de cada local, no de
 * la cuenta.
 *
 * La impresión se hace con el diálogo del sistema (`window.print()` desde un
 * iframe aislado), así que funciona con cualquier tipo y marca de impresora
 * instalada. Lo único que cambia entre formatos es la regla CSS `@page` y el
 * ancho del cuerpo del documento.
 */

export type PrinterFormatId = "thermal-80" | "thermal-58" | "a4" | "letter";

export interface PrinterFormatOption {
  id: PrinterFormatId;
  /** Nombre para el selector, ej. "Térmica 80 mm". */
  name: string;
  /** Ayuda corta mostrada bajo el selector. */
  description: string;
  /** Ticket angosto vs. hoja completa. Ajusta tipografía y márgenes. */
  variant: "receipt" | "document";
  /** Valor para la regla CSS `@page size` (ej. "80mm auto", "A4"). */
  pageSize: string;
  /** Ancho del `<body>` del documento al imprimir (ej. "80mm", "auto"). */
  bodyWidth: string;
}

export const PRINTERS: PrinterFormatOption[] = [
  {
    id: "thermal-80",
    name: "Térmica 80 mm",
    description:
      "Impresora de tickets de 80 mm (la más común en punto de venta). Sale como recibo angosto.",
    variant: "receipt",
    pageSize: "80mm auto",
    bodyWidth: "80mm"
  },
  {
    id: "thermal-58",
    name: "Térmica 58 mm",
    description:
      "Impresora de tickets pequeña, de 58 mm. Recibo más angosto, tipografía compacta.",
    variant: "receipt",
    pageSize: "58mm auto",
    bodyWidth: "58mm"
  },
  {
    id: "a4",
    name: "Hoja A4",
    description:
      "Impresora de oficina (láser o de tinta) con papel A4. La factura sale como hoja centrada.",
    variant: "document",
    pageSize: "A4",
    bodyWidth: "auto"
  },
  {
    id: "letter",
    name: "Hoja Carta",
    description:
      "Impresora de oficina (láser o de tinta) con papel Carta. La factura sale como hoja centrada.",
    variant: "document",
    pageSize: "Letter",
    bodyWidth: "auto"
  }
];

/** Formato por defecto cuando no hay preferencia guardada. */
export const DEFAULT_PRINTER_FORMAT_ID: PrinterFormatId = "thermal-80";

const PRINTER_BY_ID = new Map(PRINTERS.map((printer) => [printer.id, printer]));

/**
 * Devuelve la configuración del formato indicado. Si el id es nulo o
 * desconocido, cae al formato por defecto.
 */
export function getPrinterFormatOption(id?: string | null): PrinterFormatOption {
  return (
    (id ? PRINTER_BY_ID.get(id as PrinterFormatId) : undefined) ??
    PRINTER_BY_ID.get(DEFAULT_PRINTER_FORMAT_ID)!
  );
}

/** True si `id` corresponde a un formato de impresión conocido. */
export function isKnownPrinterFormat(id?: string | null): id is PrinterFormatId {
  return !!id && PRINTER_BY_ID.has(id as PrinterFormatId);
}
