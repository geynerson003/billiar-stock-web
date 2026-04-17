import { useMemo, useState, type FormEvent } from "react";
import { Modal, PageHeader, Panel, useConfirmDialog } from "../../../../shared/components";
import { useAuth, useLiveCollection, useToast } from "../../../../shared/hooks";
import type { Product } from "../../../../shared/types";
import {
  addOrUpdateProduct,
  businessCollection,
  calculateProductMetrics,
  deleteProduct,
  mapProduct,
} from "../../../../shared/services/firebase/business.service";
import { formatCurrency } from "../../../../shared/utils/format";

const blankProduct: Product = {
  id: "",
  name: "",
  stock: 0,
  supplierPrice: 0,
  salePrice: 0,
  minStock: 0,
  saleBasketPrice: null,
  unitsPerPackage: 1,
};

type ProductDraft = {
  id: string;
  name: string;
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
    stock: draft.existingStock + addedStock,
    supplierPrice: Number(draft.supplierPrice || 0),
    salePrice: Number(draft.salePrice || 0),
    minStock: Number(draft.minStock || 0),
    saleBasketPrice: draft.saleBasketPrice ? Number(draft.saleBasketPrice) : null,
    unitsPerPackage,
  };
}

export function InventoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const userId = user?.uid;
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [draft, setDraft] = useState<ProductDraft>(blankProductDraft);
  const [confirmDialog, confirm] = useConfirmDialog();

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

  function openCreate() {
    setDraft(blankProductDraft);
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setDraft(productToDraft(product));
    setModalOpen(true);
  }

  function openDetails(product: Product) {
    setSelectedProduct(product);
    setDetailsModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setDraft(blankProductDraft);
  }

  async function saveProduct(event: FormEvent) {
    event.preventDefault();
    if (!userId) return;

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

    await addOrUpdateProduct(userId, draftToProduct(draft));
    toast("success", draft.id ? "Producto actualizado" : "Producto creado con éxito");
    closeModal();
  }

  async function removeProduct(productId: string) {
    if (!userId) return;
    const confirmed = await confirm({
      title: "Eliminar producto",
      message: "¿Estás seguro de eliminar este producto del inventario?",
      confirmLabel: "Eliminar",
    });
    if (!confirmed) return;
    await deleteProduct(userId, productId);
    toast("success", "Producto eliminado");
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
            <button className="button button--primary" onClick={openCreate} type="button">
              Nuevo producto
            </button>
          </div>
        }
      />

      <Panel title="Catálogo" subtitle={`${filteredProducts.length} productos visibles`}>
        <div className="catalog-grid">
          {filteredProducts.length === 0 && (
            <div className="empty-state">No hay productos para mostrar con el filtro actual.</div>
          )}

          {filteredProducts.map((product) => (
            <article 
              className="catalog-card catalog-card--interactive" 
              key={product.id}
              onClick={() => openDetails(product)}
              style={{ cursor: "pointer" }}
            >
              <div className="catalog-card__top">
                <div>
                  <strong>{product.name}</strong>
                  <span>{product.stock} unidades disponibles</span>
                </div>

                <span
                  className={`badge ${
                    product.stock <= product.minStock ? "badge--danger" : ""
                  }`}
                >
                  Mín {product.minStock}
                </span>
              </div>

              <div className="catalog-card__meta">
                <span>Proveedor {formatCurrency(product.supplierPrice)}</span>
                <span>Venta {formatCurrency(product.salePrice)}</span>
                <span>Paquete {product.unitsPerPackage} und</span>
                {product.saleBasketPrice != null && (
                  <span>Canasta {formatCurrency(product.saleBasketPrice)}</span>
                )}
              </div>

              <div className="inline-actions" onClick={(e) => e.stopPropagation()}>
                <button className="button button--secondary" onClick={() => openEdit(product)} type="button">
                  Editar
                </button>
                <button className="button button--ghost" onClick={() => void removeProduct(product.id)} type="button">
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      </Panel>

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

      <Modal open={detailsModalOpen} title="Detalles Financieros del Producto" onClose={() => setDetailsModalOpen(false)}>
        {selectedProduct && (() => {
          const p = selectedProduct;
          const uxp = Math.max(p.unitsPerPackage, 1);
          
          const costoUnidad = p.supplierPrice / uxp;
          const gananciaUnidad = p.salePrice - costoUnidad;
          const margenUnidad = p.salePrice > 0 ? (gananciaUnidad / p.salePrice) * 100 : 0;

          const ventaPaquete = p.saleBasketPrice ?? (p.salePrice * uxp);
          const gananciaPaquete = ventaPaquete - p.supplierPrice;
          const margenPaquete = ventaPaquete > 0 ? (gananciaPaquete / ventaPaquete) * 100 : 0;

          const valorProveedor = p.stock * costoUnidad;
          const valorVenta = p.stock * p.salePrice;
          const gananciaPotencial = valorVenta - valorProveedor;

          return (
            <div className="form-grid" style={{ gap: '1.5rem', maxHeight: '70vh', overflowY: 'auto', paddingRight: '4px' }}>
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary-dark)' }}>CÁLCULOS POR UNIDAD</h4>
                <div className="stack-list">
                   <div className="list-row"><span>Precio proveedor por unidad</span><strong>{formatCurrency(costoUnidad)}</strong></div>
                   <div className="list-row"><span>Ganancia por unidad</span><strong>{formatCurrency(gananciaUnidad)}</strong></div>
                   <div className="list-row"><span>Margen de ganancia por unidad</span><strong>{margenUnidad.toFixed(1)}%</strong></div>
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary-dark)' }}>CÁLCULOS POR PAQUETE/CANASTA</h4>
                <div className="stack-list">
                   <div className="list-row"><span>Ganancia por paquete</span><strong>{formatCurrency(gananciaPaquete)}</strong></div>
                   <div className="list-row"><span>Margen de ganancia por paquete</span><strong>{margenPaquete.toFixed(1)}%</strong></div>
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary-dark)' }}>VALORES DEL INVENTARIO</h4>
                <div className="stack-list">
                   <div className="list-row"><span>Valor al precio del proveedor</span><strong>{formatCurrency(valorProveedor)}</strong></div>
                   <div className="list-row"><span>Valor al precio de venta</span><strong>{formatCurrency(valorVenta)}</strong></div>
                   <div className="list-row" style={{ marginTop: 8, borderTop: '1px solid var(--panel-border)', paddingTop: 8 }}>
                     <span>Ganancia potencial total</span>
                     <strong style={{ color: 'var(--green)' }}>{formatCurrency(gananciaPotencial)}</strong>
                   </div>
                </div>
              </div>
            </div>
          );
        })()}
        <div className="modal__footer" style={{ marginTop: '1.5rem' }}>
          <button className="button button--secondary" onClick={() => setDetailsModalOpen(false)} type="button">
            Cerrar
          </button>
        </div>
      </Modal>
    </div>
  );
}
