import { beforeEach, describe, expect, it } from "vitest";
import { buildInvoiceHtml } from "../../../../src/shared/utils/invoice";
import { getPrinterFormatOption } from "../../../../src/shared/constants/printer";
import { setActiveFormatConfig } from "../../../../src/shared/utils/format";
import { makeSale, makeSaleItem } from "../../../helpers/factories";

const format = getPrinterFormatOption("thermal-80");

beforeEach(() => {
  setActiveFormatConfig({ locale: "es-CO", currency: "COP" });
});

describe("buildInvoiceHtml", () => {
  it("incluye negocio, cliente y estado de pago", () => {
    const html = buildInvoiceHtml({
      sale: makeSale({ isPaid: true, totalAmount: 100 }),
      businessName: "Mi Tienda",
      clientName: "Juan",
      tableName: null,
      format,
    });
    expect(html).toContain("Mi Tienda");
    expect(html).toContain("Juan");
    expect(html).toContain("PAGADA");
  });

  it("muestra PENDIENTE DE PAGO para ventas impagas", () => {
    const html = buildInvoiceHtml({
      sale: makeSale({ isPaid: false, totalAmount: 100 }),
      businessName: "N",
      clientName: "C",
      tableName: null,
      format,
    });
    expect(html).toContain("PENDIENTE DE PAGO");
  });

  it("renderiza una fila por item y el aviso cuando no hay items", () => {
    const withItems = buildInvoiceHtml({
      sale: makeSale({
        items: [makeSaleItem({ productName: "Cerveza" }), makeSaleItem({ productName: "Papas" })],
        totalAmount: 40,
      }),
      businessName: "N",
      clientName: "C",
      tableName: "Mesa 3",
      format,
    });
    expect(withItems).toContain("Cerveza");
    expect(withItems).toContain("Papas");
    expect(withItems).toContain("Mesa 3");

    const noItems = buildInvoiceHtml({
      sale: makeSale({ items: [], totalAmount: 10 }),
      businessName: "N",
      clientName: "C",
      tableName: null,
      format,
    });
    expect(noItems).toContain("Sin detalle de productos");
  });

  it("escapa HTML en los campos de texto", () => {
    const html = buildInvoiceHtml({
      sale: makeSale({ totalAmount: 10 }),
      businessName: "<script>alert(1)</script>",
      clientName: "C",
      tableName: null,
      format,
    });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
