/**
 * Emisión e impresión de la factura/recibo de una venta.
 *
 * `buildInvoiceHtml` es una función pura que arma un documento HTML autónomo
 * (con su propio `<style>`, incluida la regla `@page`) según el formato de papel
 * configurado. `printHtml` es el único efecto de DOM: lo imprime dentro de un
 * `<iframe>` aislado usando el diálogo del sistema, así que funciona con
 * cualquier tipo y marca de impresora, sin tocar el CSS global de la app ni
 * depender de bloqueadores de pop-ups.
 */

import type { PrinterFormatOption } from "../constants/printer";
import type { Sale } from "../types/models";
import { getSaleAmount } from "./financial";
import { formatCurrency, formatDate } from "./format";

export interface InvoiceInput {
  sale: Sale;
  /** Nombre del negocio (ya resuelto, con fallback aplicado). */
  businessName: string;
  /** Nombre del cliente o "Sin cliente". */
  clientName: string;
  /** Nombre de la mesa/cuenta, o `null` si es venta externa. */
  tableName: string | null;
  format: PrinterFormatOption;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildStyles(format: PrinterFormatOption): string {
  const isReceipt = format.variant === "receipt";
  const pageMargin = isReceipt ? "4mm" : "16mm";
  const fontSize = isReceipt ? "12px" : "13px";
  const maxWidth = isReceipt ? format.bodyWidth : "170mm";

  return `
    @page { size: ${format.pageSize}; margin: ${pageMargin}; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      width: ${format.bodyWidth === "auto" ? "auto" : format.bodyWidth};
      max-width: ${maxWidth};
      margin: 0 auto;
      font-family: ${isReceipt
        ? '"Courier New", ui-monospace, monospace'
        : 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'};
      font-size: ${fontSize};
      line-height: 1.45;
      color: #000;
    }
    .invoice__business { text-align: center; font-weight: 700; font-size: ${isReceipt ? "14px" : "18px"}; }
    .invoice__title { text-align: center; margin: 2px 0 8px; text-transform: uppercase; letter-spacing: 1px; }
    .invoice__meta { margin: 0 0 8px; }
    .invoice__meta div { display: flex; justify-content: space-between; gap: 12px; }
    .invoice__meta span:last-child { text-align: right; word-break: break-all; }
    hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 2px 0; vertical-align: top; }
    th.num, td.num { text-align: right; white-space: nowrap; }
    tfoot td { font-weight: 700; font-size: ${isReceipt ? "13px" : "15px"}; padding-top: 6px; }
    .invoice__status { margin-top: 8px; text-align: center; font-weight: 700; }
    .invoice__footer { margin-top: 12px; text-align: center; font-size: ${isReceipt ? "11px" : "12px"}; }
  `;
}

export function buildInvoiceHtml(input: InvoiceInput): string {
  const { sale, businessName, clientName, tableName, format } = input;
  const total = getSaleAmount(sale);

  const rows = sale.items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.productName || "Producto")}</td>
          <td class="num">${item.quantity} x ${formatCurrency(item.unitPrice)}</td>
          <td class="num">${formatCurrency(item.totalPrice)}</td>
        </tr>`
    )
    .join("");

  const emptyRow = sale.items.length
    ? ""
    : `<tr><td colspan="3">Sin detalle de productos</td></tr>`;

  const tableLine = tableName
    ? `<div><span>Mesa</span><span>${escapeHtml(tableName)}</span></div>`
    : "";

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Factura ${escapeHtml(sale.id || "venta")}</title>
  <style>${buildStyles(format)}</style>
</head>
<body>
  <div class="invoice__business">${escapeHtml(businessName)}</div>
  <div class="invoice__title">Factura de venta</div>
  <div class="invoice__meta">
    <div><span>Fecha</span><span>${formatDate(sale.date)}</span></div>
    <div><span>Ref</span><span>${escapeHtml(sale.id || "-")}</span></div>
    <div><span>Cliente</span><span>${escapeHtml(clientName)}</span></div>
    ${tableLine}
  </div>
  <hr />
  <table>
    <thead>
      <tr><th>Producto</th><th class="num">Cant. x P. unit.</th><th class="num">Subtotal</th></tr>
    </thead>
    <tbody>
      ${rows}${emptyRow}
    </tbody>
    <tfoot>
      <tr><td colspan="2">TOTAL</td><td class="num">${formatCurrency(total)}</td></tr>
    </tfoot>
  </table>
  <div class="invoice__status">${sale.isPaid ? "PAGADA" : "PENDIENTE DE PAGO"}</div>
  <div class="invoice__footer">Gracias por su compra</div>
</body>
</html>`;
}

/**
 * Imprime un documento HTML autónomo dentro de un iframe oculto y lo remueve al
 * terminar. Usa el diálogo de impresión del sistema (cualquier impresora).
 */
export function printHtml(html: string): void {
  if (typeof document === "undefined") return;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    // Pequeño retardo: algunos navegadores necesitan el iframe vivo hasta que
    // el diálogo de impresión se cierra por completo.
    window.setTimeout(() => iframe.remove(), 500);
  };

  iframe.onload = () => {
    const frameWindow = iframe.contentWindow;
    if (!frameWindow) {
      cleanup();
      return;
    }
    frameWindow.onafterprint = cleanup;
    try {
      frameWindow.focus();
      frameWindow.print();
    } catch {
      cleanup();
    }
    // Respaldo por si `onafterprint` no dispara (algunos móviles).
    window.setTimeout(cleanup, 60_000);
  };

  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    iframe.remove();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
}
