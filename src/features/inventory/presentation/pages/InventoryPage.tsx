import { useEffect, useMemo, useState, type FormEvent } from "react";
import { BarcodeScanModal, Modal, PageHeader, QueryError, useConfirmDialog } from "../../../../shared/components";
import { useAsyncAction, useBusinessId, useLiveCollection, usePermissions, useScannerMode, useToast } from "../../../../shared/hooks";
import type { Product } from "../../../../shared/types";
import {
  addOrUpdateProduct,
  businessCollection,
  calculateProductMetrics,
  deleteProduct,
  findProductByBarcode,
  mapProduct,
} from "../../../../shared/services/firebase/business.service";
import { calculateProductFinancials } from "../../../../shared/utils/financial";
import { formatCurrency } from "../../../../shared/utils/format";

type ProductDraft = {
  id: string;
  name: string;
  barcode: string;
  packageQuantity: string;
  supplierPrice: string;
  salePrice: string;
  minStock: string;
  saleBasketPrice: string;
  unitsPerPackage: string;
  existingStock: number;
};

const blankProductDraft: ProductDraft = {
  id: "",
  name: "",
  barcode: "",
  packageQuantity: "0",
  supplierPrice: "0",
  salePrice: "0",
  minStock: "0",
  saleBasketPrice: "",
  unitsPerPackage: "1",
  existingStock: 0,
};

function productToDraft(product: Product): ProductDraft {
  const unitsPerPackage = Math.max(product.unitsPerPackage, 1);

  return {
    id: product.id,
    name: product.name,
    barcode: product.barcode ?? "",
    packageQuantity: "0",
    supplierPrice: String(product.supplierPrice),
    salePrice: String(product.salePrice),
    minStock: String(product.minStock),
    saleBasketPrice: product.saleBasketPrice != null ? String(product.saleBasketPrice) : "",
    unitsPerPackage: String(unitsPerPackage),
    existingStock: product.stock,
  };
}

function draftToProduct(draft: ProductDraft): Product {
  const unitsPerPackage = Number(draft.unitsPerPackage || 1);
  const packageQuantity = Number(draft.packageQuantity || 0);
  const addedStock = packageQuantity * unitsPerPackage;

  return {
    id: draft.id,
    name: draft.name.trim(),
    barcode: draft.barcode.trim() ? draft.barcode.trim() : null,
    stock: draft.existingStock + addedStock,
    supplierPrice: Number(draft.supplierPrice || 0),
    salePrice: Number(draft.salePrice || 0),
    minStock: Number(draft.minStock || 0),
    saleBasketPrice: draft.saleBasketPrice ? Number(draft.saleBasketPrice) : null,
    unitsPerPackage,
  };
}

export function InventoryPage() {
  const { toast } = useToast();
  const { run: runAction } = useAsyncAction();
  const { can } = usePermissions();
  const userId = useBusinessId(); // businessId efectivo (uid del dueño)
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProductDraft>(blankProductDraft);
  const [confirmDialog, confirm] = useConfirmDialog();
  const { scannerMode } = useScannerMode();
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [scanTarget, setScanTarget] = useState<"create" | "field" | null>(null);

  const products = useLiveCollection(
    () => (userId ? businessCollection(userId, "products") : null),
    [userId],
    mapProduct
  );

  const filteredProducts = useMemo(
    () =>
      products.data.filter((product) =>
        product.name.toLowerCase().includes(search.toLowerCase())
      ),
    [products.data, search]
  );

  const selectedProduct = useMemo(
    () =>
      filteredProducts.find((product) => product.id === selectedId) ??
      filteredProducts[0] ??
      null,
    [filteredProducts, selectedId]
  );

  useEffect(() => {
    if (selectedProduct && selectedProduct.id !== selectedId) {
      setSelectedId(selectedProduct.id);
    }
  }, [selectedProduct, selectedId]);

  function openCreate() {
    setDraft(blankProductDraft);
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setDraft(productToDraft(product));
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setDraft(blankProductDraft);
  }

  function openScanCreate() {
    setScanTarget("create");
    setScanModalOpen(true);
  }

  function openScanField() {
    setScanTarget("field");
    setScanModalOpen(true);
  }

  async function handleBarcodeDetected(code: string) {
    if (scanTarget === "field") {
      handleTextChange("barcode", code);
      return;
    }

    if (!userId) return;
    const existing = await findProductByBarcode(userId, code);
    if (existing) {
      toast("info", `Ya existe "${existing.name}" con ese código. Ábrelo para actualizar su stock.`);
      openEdit(existing);
    } else {
      setDraft({ ...blankProductDraft, barcode: code });
      setModalOpen(true);
    }
  }

  async function saveProduct(event: FormEvent) {
    event.preventDefault();
    if (!userId || !can("inventory.edit")) return;

    if (
      !draft.name.trim() ||
      draft.packageQuantity === "" ||
      draft.supplierPrice === "" ||
      draft.salePrice === "" ||
      draft.minStock === "" ||
      draft.unitsPerPackage === ""
    ) {
      toast("warning", "Por favor completa todos los campos obligatorios.");
      return;
    }

    const packageQty = Number(draft.packageQuantity || 0);
    if (packageQty < 0) {
      toast("warning", "La cantidad de paquetes no puede ser negativa.");
      return;
    }

    if (draft.barcode.trim()) {
      const existing = await findProductByBarcode(userId, draft.barcode.trim());
      if (existing && existing.id !== draft.id) {
        toast("warning", `El código de barras ya está asignado a "${existing.name}".`);
        return;
      }
    }

    await runAction(() => addOrUpdateProduct(userId, draftToProduct(draft)), {
      success: draft.id ? "Producto actualizado" : "Producto creado con éxito",
      errorFallbackId: "inventory.save.error",
      onSuccess: closeModal,
    });
  }

  async function removeProduct(productId: string) {
    if (!userId || !can("inventory.delete")) return;
    const confirmed = await confirm({
      title: "Eliminar producto",
      message: "¿Estás seguro de eliminar este producto del inventario?",
      confirmLabel: "Eliminar",
    });
    if (!confirmed) return;
    await runAction(() => deleteProduct(userId, productId), {
      success: "inventory.delete.success",
      errorFallbackId: "inventory.delete.error",
    });
  }

  function handleTextChange<K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) {
    setDraft((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function handleNumberFocus<K extends keyof ProductDraft>(key: K, defaultValue: string) {
    setDraft((prev) => ({
      ...prev,
      [key]: prev[key] === defaultValue ? "" : prev[key],
    }));
  }

  function handleNumberBlur<K extends keyof ProductDraft>(key: K, defaultValue: string) {
    setDraft((prev) => ({
      ...prev,
      [key]: prev[key] === "" ? defaultValue : prev[key],
    }));
  }

  const metrics = calculateProductMetrics(draftToProduct(draft));

  const detailRows: Array<{ k: string; v: string; tone?: string }> = selectedProduct
    ? (() => {
        const p = selectedProduct;
        const fin = calculateProductFinancials(p);
        return [
          { k: "Stock actual", v: `${p.stock} und` },
          { k: "Stock mínimo", v: `${p.minStock} und` },
          { k: "Costo por unidad", v: formatCurrency(fin.costoUnidad) },
          { k: "Precio de venta", v: formatCurrency(p.salePrice) },
          {
            k: "Ganancia por unidad",
            v: formatCurrency(fin.gananciaUnidad),
            tone: fin.gananciaUnidad >= 0 ? "var(--green)" : "var(--red)",
          },
          { k: "Margen por unidad", v: `${fin.margenUnidad.toFixed(1)}%` },
          { k: "Ganancia por paquete/canasta", v: formatCurrency(fin.gananciaPaquete) },
          { k: "Margen por paquete/canasta", v: `${fin.margenPaquete.toFixed(1)}%` },
          { k: "Valor a precio proveedor", v: formatCurrency(fin.valorProveedor) },
          { k: "Valor a precio de venta", v: formatCurrency(fin.valorVenta) },
          {
            k: "Ganancia potencial total",
            v: formatCurrency(fin.gananciaPotencial),
            tone: "var(--green)",
          },
        ];
      })()
    : [];

  return (
    <div className="page page-themed page-themed--inventory">
      {confirmDialog}

      <PageHeader
        eyebrow="Inventario"
        title="Control de productos"
        description="Gestiona el inventario de tu negocio de manera eficiente."
        actions={
          <div className="inline-actions">
            <input
              className="search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar producto…"
            />
            {can("inventory.edit") && (
              <>
                <button className="button button--secondary" onClick={openScanCreate} type="button">
                  Escanear código de barras
                </button>
                <button className="button button--primary" onClick={openCreate} type="button">
                  Nuevo producto
                </button>
              </>
            )}
          </div>
        }
      />

      <QueryError error={products.error} />

      <div className="master-detail">
        <div className="data-list">
          <div className="data-list__head">
            <span>{filteredProducts.length} productos</span>
            <span>Stock · Precio</span>
          </div>

          {filteredProducts.map((product) => {
            const low = product.stock <= product.minStock;
            const ratio = Math.min(
              100,
              (product.stock / Math.max(product.minStock * 3, 1)) * 100
            );
            return (
              <button
                type="button"
                key={product.id}
                className={`data-list__row${
                  product.id === selectedProduct?.id ? " data-list__row--selected" : ""
                }`}
                onClick={() => setSelectedId(product.id)}
              >
                <span className="data-list__row-top">
                  <strong>{product.name}</strong>
                  <span className="data-list__row-price">{formatCurrency(product.salePrice)}</span>
                </span>
                <span className="data-list__row-sub">
                  <span className="data-list__bar">
                    <span
                      style={{
                        width: `${ratio}%`,
                        background: low ? "var(--red)" : "var(--green)",
                      }}
                    />
                  </span>
                  <span
                    className="data-list__bar-label"
                    style={{ color: low ? "var(--red)" : "var(--muted)" }}
                  >
                    {product.stock} und
                  </span>
                </span>
              </button>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="empty-state">
              {search
                ? `Ningún producto coincide con «${search}».`
                : "Aún no has registrado productos."}
            </div>
          )}
        </div>

        {selectedProduct && (
          <aside className="detail-aside">
            <div className="detail-aside__eyebrow">Detalle</div>
            <div className="detail-aside__name">{selectedProduct.name}</div>

            {detailRows.map((row) => (
              <div className="detail-row" key={row.k}>
                <span>{row.k}</span>
                <strong style={row.tone ? { color: row.tone } : undefined}>{row.v}</strong>
              </div>
            ))}

            <div className="detail-aside__actions">
              {can("inventory.edit") && (
                <button
                  className="button button--secondary"
                  onClick={() => openEdit(selectedProduct)}
                  type="button"
                >
                  Editar
                </button>
              )}
              {can("inventory.delete") && (
                <button
                  className="button button--ghost"
                  onClick={() => void removeProduct(selectedProduct.id)}
                  type="button"
                >
                  Eliminar
                </button>
              )}
            </div>
          </aside>
        )}
      </div>

      <Modal
        open={modalOpen}
        title={draft.id ? "Editar producto" : "Crear producto"}
        onClose={closeModal}
      >
        <form className="form-grid" onSubmit={saveProduct}>
          <label className="field">
            <span>Nombre</span>
            <input
              required
              value={draft.name}
              onChange={(event) => handleTextChange("name", event.target.value)}
            />
          </label>

          <label className="field">
            <span>Código de barras (opcional)</span>
            <div className="inline-actions">
              <input
                value={draft.barcode}
                onChange={(event) => handleTextChange("barcode", event.target.value)}
                placeholder="Escribe o escanea el código…"
              />
              <button className="button button--secondary" onClick={openScanField} type="button">
                Escanear
              </button>
            </div>
          </label>

          <label className="field">
            <span>Cantidad de paquetes a agregar (stock nuevo)</span>
            <input
              required
              type="number"
              value={draft.packageQuantity}
              onFocus={() => handleNumberFocus("packageQuantity", "0")}
              onBlur={() => handleNumberBlur("packageQuantity", "0")}
              onChange={(event) => handleTextChange("packageQuantity", event.target.value)}
            />
          </label>

          <label className="field">
            <span>Stock resultante calculado</span>
            <input
              type="number"
              min="0"
              value={draft.existingStock + (Number(draft.packageQuantity || 0) * Number(draft.unitsPerPackage || 1))}
              disabled
              readOnly
              title="Stock que existía + (Nuevos paquetes x Unidades)"
            />
          </label>

          <label className="field">
            <span>Precio proveedor</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={draft.supplierPrice}
              onFocus={() => handleNumberFocus("supplierPrice", "0")}
              onBlur={() => handleNumberBlur("supplierPrice", "0")}
              onChange={(event) => handleTextChange("supplierPrice", event.target.value)}
            />
          </label>

          <label className="field">
            <span>Precio venta unidad</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={draft.salePrice}
              onFocus={() => handleNumberFocus("salePrice", "0")}
              onBlur={() => handleNumberBlur("salePrice", "0")}
              onChange={(event) => handleTextChange("salePrice", event.target.value)}
            />
          </label>

          <label className="field">
            <span>Precio venta canasta</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={draft.saleBasketPrice}
              onChange={(event) => handleTextChange("saleBasketPrice", event.target.value)}
            />
          </label>

          <label className="field">
            <span>Unidades por paquete</span>
            <input
              required
              type="number"
              min="1"
              value={draft.unitsPerPackage}
              onFocus={() => handleNumberFocus("unitsPerPackage", "1")}
              onBlur={() => handleNumberBlur("unitsPerPackage", "1")}
              onChange={(event) => handleTextChange("unitsPerPackage", event.target.value)}
            />
          </label>

          <label className="field">
            <span>Stock mínimo</span>
            <input
              required
              type="number"
              min="0"
              value={draft.minStock}
              onFocus={() => handleNumberFocus("minStock", "0")}
              onBlur={() => handleNumberBlur("minStock", "0")}
              onChange={(event) => handleTextChange("minStock", event.target.value)}
            />
          </label>

          <div className="form-summary">
            <strong>Métrica rápida</strong>
            <span>Costo por unidad: {formatCurrency(metrics.supplierPerUnit)}</span>
            <span>Ganancia por unidad: {formatCurrency(metrics.profitPerUnit)}</span>
          </div>

          <div className="modal__footer">
            <button className="button button--secondary" onClick={closeModal} type="button">
              Cancelar
            </button>
            <button className="button button--primary" type="submit">
              Guardar producto
            </button>
          </div>
        </form>
      </Modal>

      <BarcodeScanModal
        open={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        onDetect={(code) => void handleBarcodeDetected(code)}
        initialMode={scannerMode}
        closeOnDetect
      />
    </div>
  );
}
