import { useMemo, useState, type FormEvent } from "react";
import { BarcodeScanModal, Modal, PageHeader, Panel, QueryError, useConfirmDialog } from "../../../../shared/components";
import {
  useAsyncAction,
  useAuth,
  useBusinessId,
  useLiveCollection,
  useMarket,
  usePermissions,
  usePrinterFormat,
  useScannerMode,
  useToast,
} from "../../../../shared/hooks";
import { APP_BRAND_NAME, getPrinterFormatOption } from "../../../../shared/constants";
import type { Product, ReportFilter, ReportType, Sale, SaleItem, SaleType } from "../../../../shared/types";
import {
  addSale,
  businessCollection,
  computeSaleLineItem,
  deleteSale,
  mapClient,
  mapProduct,
  mapSale,
  mapTable,
} from "../../../../shared/services/firebase/business.service";
import { calculateProfitForDraftItems, getDateRange, getSaleAmount } from "../../../../shared/utils/financial";
import { formatCurrency, formatDate } from "../../../../shared/utils/format";
import { buildInvoiceHtml, printHtml } from "../../../../shared/utils/invoice";

type SaleDraft = {
  selectedQuantity: string;
};

const blankSaleDraft: SaleDraft = {
  selectedQuantity: "1",
};

export function SalesPage() {
  const { profile, actorId } = useAuth();
  const { can } = usePermissions();
  const { toast } = useToast();
  const { run: runAction } = useAsyncAction();
  const market = useMarket();
  const { printerFormat } = usePrinterFormat();
  const showTables = market.features.tables;
  const userId = useBusinessId(); // businessId efectivo (uid del dueño)
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantityDraft, setQuantityDraft] = useState<SaleDraft>(blankSaleDraft);
  const [saleByBasket, setSaleByBasket] = useState(false);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [saleType, setSaleType] = useState<SaleType>("EXTERNAL");
  const [tableId, setTableId] = useState("");
  const [clientId, setClientId] = useState("");
  const [isPaid, setIsPaid] = useState(true);
  const [viewedSale, setViewedSale] = useState<Sale | null>(null);
  const isViewing = viewedSale !== null;
  const [confirmDialog, confirm] = useConfirmDialog();
  const { scannerMode } = useScannerMode();
  const [scanModalOpen, setScanModalOpen] = useState(false);

  const [filterType, setFilterType] = useState<ReportType>("DAILY");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const products = useLiveCollection(
    () => (userId ? businessCollection(userId, "products") : null),
    [userId],
    mapProduct
  );
  const clients = useLiveCollection(
    () => (userId ? businessCollection(userId, "clients") : null),
    [userId],
    mapClient
  );
  const tables = useLiveCollection(
    () => (userId ? businessCollection(userId, "tables") : null),
    [userId],
    mapTable
  );
  const sales = useLiveCollection(
    () => (userId ? businessCollection(userId, "sales") : null),
    [userId],
    mapSale
  );

  const filter: ReportFilter = useMemo(
    () => ({
      type: filterType,
      startDate: startDate ? new Date(startDate).getTime() : undefined,
      endDate: endDate ? new Date(endDate).getTime() + 86_399_999 : undefined,
    }),
    [endDate, filterType, startDate]
  );

  const filteredSales = useMemo(
    () => {
      const range = getDateRange(filter);
      return sales.data
        .filter((sale) => sale.date >= range.start && sale.date <= range.end)
        .filter((sale) => {
          const clientName =
            clients.data.find((client) => client.id === sale.clientId)?.nombre ?? "";
          const tableName =
            tables.data.find((table) => table.id === sale.tableId)?.name ?? "";

          return [clientName, tableName, ...sale.items.map((item) => item.productName)]
            .join(" ")
            .toLowerCase()
            .includes(search.toLowerCase());
        })
        .sort((a, b) => b.date - a.date);
    },
    [clients.data, filter, sales.data, search, tables.data]
  );

  const totalDraft = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const selectedProduct =
    products.data.find((product) => product.id === selectedProductId) ?? null;

  const salesStats = useMemo(() => {
    const total = filteredSales.reduce((sum, sale) => sum + getSaleAmount(sale), 0);
    const pending = filteredSales
      .filter((sale) => !sale.isPaid)
      .reduce((sum, sale) => sum + getSaleAmount(sale), 0);
    const average = filteredSales.length > 0 ? total / filteredSales.length : 0;
    return { total, pending, average };
  }, [filteredSales]);

  const rangeChips: Array<{ label: string; value: ReportType }> = [
    { label: "Hoy", value: "DAILY" },
    { label: "Semana", value: "WEEKLY" },
    { label: "Mes", value: "MONTHLY" },
    { label: "Personalizado", value: "CUSTOM" },
  ];

  function resetDraft() {
    setSelectedProductId("");
    setQuantityDraft(blankSaleDraft);
    setSaleByBasket(false);
    setItems([]);
    setSaleType("EXTERNAL");
    setTableId("");
    setClientId("");
    setIsPaid(true);
    setViewedSale(null);
  }

  function handleQuantityFocus() {
    if (quantityDraft.selectedQuantity === "1") {
      setQuantityDraft({ selectedQuantity: "" });
    }
  }

  function handleQuantityBlur() {
    if (quantityDraft.selectedQuantity === "" || Number(quantityDraft.selectedQuantity) < 1) {
      setQuantityDraft({ selectedQuantity: "1" });
    }
  }

  function openCreate() {
    resetDraft();
    setModalOpen(true);
  }

  function openView(sale: Sale) {
    setSaleType(sale.type);
    setTableId(sale.tableId ?? "");
    setClientId(sale.clientId ?? "");
    setIsPaid(sale.isPaid);
    setItems(sale.items);
    setViewedSale(sale);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    resetDraft();
  }

  function addItem(productOverride?: Product) {
    const product = productOverride ?? selectedProduct;
    if (!product) return;

    const quantity = Number(quantityDraft.selectedQuantity || 0);
    if (quantity < 1) {
      toast("warning", "La cantidad debe ser mayor a 0");
      return;
    }
    if (saleByBasket && product.saleBasketPrice == null) {
      toast("warning", "Este producto no tiene precio por canasta configurado");
      return;
    }

    setItems((current) => [
      ...current,
      computeSaleLineItem(product, quantity, saleByBasket),
    ]);
    setSelectedProductId("");
    setQuantityDraft(blankSaleDraft);
    setSaleByBasket(false);
  }

  function handleSaleScan(code: string) {
    const product = products.data.find((p) => p.barcode === code);
    if (!product) {
      toast("warning", "No se encontró ningún producto con ese código.");
      return;
    }
    if (saleByBasket && product.saleBasketPrice == null) {
      toast("warning", `"${product.name}" no tiene precio por canasta configurado.`);
      return;
    }

    const quantity = Number(quantityDraft.selectedQuantity || 0) || 1;
    setItems((current) => [...current, computeSaleLineItem(product, quantity, saleByBasket)]);
    toast("success", `${product.name} agregado.`);
  }

  async function saveSale(event: FormEvent) {
    event.preventDefault();
    if (!userId || !can("sales.create")) return;

    if (items.length === 0) {
      toast("warning", "Agrega al menos un item a la venta");
      return;
    }

    if (saleType === "TABLE" && !tableId) {
      toast("warning", "Selecciona una mesa para ventas por mesa");
      return;
    }

    const sale: Sale = {
      id: "",
      items,
      totalAmount: totalDraft,
      profit: calculateProfitForDraftItems(items, products.data),
      date: Date.now(),
      tableId: saleType === "TABLE" ? tableId : null,
      type: saleType,
      sellerId: actorId ?? userId,
      clientId,
      isPaid,
      isGameSale: false,
      gameId: null,
      productId: "",
      productName: "",
      quantity: 0,
      price: 0,
    };

    await runAction(() => addSale(userId, sale), {
      success: "sales.save.success",
      errorFallbackId: "sales.save.error",
      onSuccess: closeModal,
    });
  }

  async function removeSale(sale: Sale) {
    if (!userId || !can("sales.delete")) return;
    const confirmed = await confirm({
      title: "Eliminar venta",
      message: "¿Eliminar esta venta y revertir sus efectos?",
      confirmLabel: "Eliminar",
    });
    if (!confirmed) return;
    await runAction(() => deleteSale(userId, sale), {
      success: "sales.delete.success",
      errorFallbackId: "sales.delete.error",
    });
  }

  function printSale(sale: Sale) {
    const clientName =
      clients.data.find((client) => client.id === sale.clientId)?.nombre ?? "Sin cliente";
    const tableName =
      tables.data.find((table) => table.id === sale.tableId)?.name ?? null;

    printHtml(
      buildInvoiceHtml({
        sale,
        businessName: profile?.businessName?.trim() || APP_BRAND_NAME,
        clientName,
        tableName,
        format: getPrinterFormatOption(printerFormat),
      })
    );
  }

  return (
    <div className="page page-themed page-themed--sales">
      {confirmDialog}

      <PageHeader
        eyebrow="Ventas"
        title="Movimientos"
        description="Gestiona tus ventas y registra nuevas ventas."
        actions={
          <div className="inline-actions">
            <input
              className="search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={showTables ? "Buscar por cliente, mesa o producto…" : "Buscar por cliente o producto…"}
            />
            {can("sales.create") && (
              <button className="button button--primary" onClick={openCreate} type="button">
                Nueva venta
              </button>
            )}
          </div>
        }
      />

      <QueryError error={sales.error ?? products.error} />

      <div className="range-chips">
        {rangeChips.map((chip) => (
          <button
            key={chip.value}
            type="button"
            className={`range-chip${filterType === chip.value ? " range-chip--active" : ""}`}
            onClick={() => setFilterType(chip.value)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {filterType === "CUSTOM" && (
        <div className="filter-grid">
          <label className="field">
            <span>Fecha inicio</span>
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </label>
          <label className="field">
            <span>Fecha fin</span>
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </label>
        </div>
      )}

      <div className="kpi-strip">
        <div className="kpi-strip__cell">
          <span className="kpi-strip__label">Total vendido</span>
          <strong className="kpi-strip__value">{formatCurrency(salesStats.total)}</strong>
        </div>
        <div className="kpi-strip__cell">
          <span className="kpi-strip__label">Por cobrar</span>
          <strong className="kpi-strip__value">{formatCurrency(salesStats.pending)}</strong>
        </div>
        <div className="kpi-strip__cell">
          <span className="kpi-strip__label">Ticket promedio</span>
          <strong className="kpi-strip__value">{formatCurrency(salesStats.average)}</strong>
        </div>
      </div>

      <Panel title="Historial reciente" subtitle={`${filteredSales.length} ventas`}>
        <div className="stack-list">
          {filteredSales.map((sale) => {
            const client =
              clients.data.find((entry) => entry.id === sale.clientId)?.nombre ?? "Sin cliente";
            const table =
              tables.data.find((entry) => entry.id === sale.tableId)?.name ?? "Externa";

            return (
              <div
                className="list-row list-row--expanded"
                key={sale.id}
                onClick={() => openView(sale)}
                style={{ cursor: "pointer" }}
              >
                <div>
                  <strong>{client}</strong>
                  <span>
                    {table} · {formatDate(sale.date)}
                  </span>
                </div>
                <div className="inline-actions">
                  <span className={`badge ${sale.isPaid ? "badge--success" : "badge--danger"}`}>
                    {sale.isPaid ? "Pagada" : "Pendiente"}
                  </span>
                  <strong>{formatCurrency(getSaleAmount(sale))}</strong>
                  <button
                    className="button button--ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      printSale(sale);
                    }}
                    type="button"
                  >
                    Imprimir
                  </button>
                  {can("sales.delete") && (
                    <button
                      className="button button--ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        void removeSale(sale);
                      }}
                      type="button"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {filteredSales.length === 0 && (
            <div className="empty-state">No hay ventas para el filtro actual.</div>
          )}
        </div>
      </Panel>

      <Modal open={modalOpen} title={isViewing ? "Detalles de la venta" : "Registrar venta"} onClose={closeModal}>
        <form onSubmit={saveSale} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="form-grid" style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: "4px" }}>
            <div className="form-grid field--full">
              {(showTables || isViewing) && (
                <label className="field">
                  <span>Tipo de venta</span>
                  <select value={saleType} onChange={(event) => setSaleType(event.target.value as SaleType)} disabled={isViewing}>
                    <option value="EXTERNAL">Externa</option>
                    <option value="TABLE">{market.terms.salesTableOption}</option>
                  </select>
                </label>
              )}

              {saleType === "TABLE" && (showTables || isViewing) && (
                <label className="field">
                  <span>Mesa</span>
                  <select value={tableId} onChange={(event) => setTableId(event.target.value)} required disabled={isViewing}>
                    <option value="">Selecciona una mesa</option>
                    {tables.data.map((table) => (
                      <option key={table.id} value={table.id}>
                        {table.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="field">
                <span>Cliente</span>
                <select value={clientId} onChange={(event) => setClientId(event.target.value)} disabled={isViewing}>
                  <option value="">Sin cliente</option>
                  {clients.data.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label className={saleType === "EXTERNAL" ? "field field--full" : "field"}>
                <span>Estado</span>
                <select value={String(isPaid)} onChange={(event) => setIsPaid(event.target.value === "true")} disabled={isViewing}>
                  <option value="true">Pagada</option>
                  <option value="false">Pendiente</option>
                </select>
              </label>
            </div>

            {!isViewing && (
              <div className="form-grid form-grid--compact">
                <label className="field">
                  <span>Producto</span>
                  <div className="inline-actions">
                    <select value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)}>
                      <option value="">Selecciona un producto</option>
                      {products.data.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                    <button className="button button--secondary" onClick={() => setScanModalOpen(true)} type="button">
                      Escanear código
                    </button>
                  </div>
                </label>

                <label className="field">
                  <span>Cantidad</span>
                  <input
                    required
                    min="1"
                    type="number"
                    value={quantityDraft.selectedQuantity}
                    onChange={(event) => setQuantityDraft({ selectedQuantity: event.target.value })}
                    onFocus={handleQuantityFocus}
                    onBlur={handleQuantityBlur}
                  />
                </label>

                <label className="toggle">
                  <input
                    checked={saleByBasket}
                    onChange={(event) => setSaleByBasket(event.target.checked)}
                    type="checkbox"
                  />
                  <span>Vender por canasta</span>
                </label>

                <button className="button button--secondary" onClick={() => addItem()} type="button">
                  Agregar item
                </button>
              </div>
            )}

            {!isViewing && saleByBasket && selectedProduct?.saleBasketPrice == null && selectedProduct && (
              <div className="empty-state field--full">Este producto no tiene precio por canasta configurado.</div>
            )}

            <div className="field--full">
              <Panel title="Items de la venta" subtitle={`Total: ${formatCurrency(isViewing ? getSaleAmount(viewedSale!) : totalDraft)}`}>
                <div className="stack-list">
                  {items.map((item, index) => (
                    <div className="list-row" key={`${item.productId}-${index}`}>
                      <div>
                        <strong>{item.productName}</strong>
                        <span>
                          {item.quantity} x {formatCurrency(item.unitPrice)}
                        </span>
                      </div>
                      <div className="inline-actions">
                        <strong>{formatCurrency(item.totalPrice)}</strong>
                        {!isViewing && (
                          <button
                            className="button button--ghost"
                            onClick={() =>
                              setItems((current) => current.filter((_, currentIndex) => currentIndex !== index))
                            }
                            type="button"
                          >
                            Quitar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="empty-state">
                      {isViewing ? "Esta venta no tiene productos detallados." : "Agrega productos para construir la venta."}
                    </div>
                  )}
                </div>
              </Panel>
            </div>
          </div>

          <div className="modal__footer field--full">
            <button className="button button--secondary" onClick={closeModal} type="button">
              {isViewing ? "Cerrar" : "Cancelar"}
            </button>
            {isViewing && viewedSale && (
              <button
                className="button button--primary"
                onClick={() => printSale(viewedSale)}
                type="button"
              >
                Imprimir factura
              </button>
            )}
            {!isViewing && (
              <button className="button button--primary" disabled={items.length === 0} type="submit">
                Guardar venta
              </button>
            )}
          </div>
        </form>
      </Modal>

      <BarcodeScanModal
        open={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        onDetect={handleSaleScan}
        initialMode={scannerMode}
        closeOnDetect={false}
      />
    </div>
  );
}
