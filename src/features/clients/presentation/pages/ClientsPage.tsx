import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Modal, PageHeader, Panel, useConfirmDialog } from "../../../../shared/components";
import { useAuth, useLiveCollection, useToast } from "../../../../shared/hooks";
import type { Client } from "../../../../shared/types";
import {
  addOrUpdateClient,
  businessCollection,
  deleteClient,
  mapClient,
  mapSale,
} from "../../../../shared/services/firebase/business.service";
import { getSaleAmount } from "../../../../shared/utils/financial";
import { formatCurrency, formatPhone } from "../../../../shared/utils/format";

const blankClient: Client = {
  id: "",
  nombre: "",
  telefono: "",
  deuda: 0,
  deudaOriginal: 0,
  totalPagado: 0,
};

export function ClientsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const userId = user?.uid;
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<Client>(blankClient);
  const [confirmDialog, confirm] = useConfirmDialog();

  const clients = useLiveCollection(
    () => (userId ? businessCollection(userId, "clients") : null),
    [userId],
    mapClient
  );
  const sales = useLiveCollection(
    () => (userId ? businessCollection(userId, "sales") : null),
    [userId],
    mapSale
  );

  const pendingDebtMap = useMemo(() => {
    const debtMap = new Map<string, number>();
    sales.data
      .filter((sale) => !sale.isPaid && sale.clientId)
      .forEach((sale) => {
        debtMap.set(sale.clientId, (debtMap.get(sale.clientId) ?? 0) + getSaleAmount(sale));
      });
    return debtMap;
  }, [sales.data]);

  const filteredClients = useMemo(
    () =>
      clients.data.filter((client) =>
        `${client.nombre} ${client.telefono}`.toLowerCase().includes(search.toLowerCase())
      ),
    [clients.data, search]
  );

  function openCreate() {
    setDraft(blankClient);
    setModalOpen(true);
  }

  function openEdit(client: Client) {
    setDraft(client);
    setModalOpen(true);
  }

  async function saveClient(event: FormEvent) {
    event.preventDefault();
    if (!userId) return;
    await addOrUpdateClient(userId, draft);
    toast("success", draft.id ? "Cliente actualizado" : "Cliente creado con éxito");
    setModalOpen(false);
  }

  async function removeClient(clientId: string) {
    if (!userId) return;
    const confirmed = await confirm({
      title: "Eliminar cliente",
      message: "¿Estás seguro de eliminar este cliente?",
      confirmLabel: "Eliminar",
    });
    if (!confirmed) return;
    await deleteClient(userId, clientId);
    toast("success", "Cliente eliminado");
  }

  return (
    <div className="page page-themed page-themed--clients">
      {confirmDialog}

      <PageHeader
        eyebrow="Clientes"
        title="Gestión de clientes"
        description="Gestiona tus clientes y sus deudas."
        actions={
          <div className="inline-actions">
            <input
              className="search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar cliente…"
            />
            <button className="button button--primary" onClick={openCreate} type="button">
              Nuevo cliente
            </button>
          </div>
        }
      />

      <Panel title="Clientes activos" subtitle={`${filteredClients.length} registros`}>
        <div className="catalog-grid">
          {filteredClients.map((client) => {
            const debt = client.deuda > 0 ? client.deuda : pendingDebtMap.get(client.id) ?? 0;

            return (
              <article className="catalog-card" key={client.id}>
                <div className="catalog-card__top">
                  <div>
                    <strong>{client.nombre}</strong>
                    <span>{formatPhone(client.telefono)}</span>
                  </div>

                  <span className={`badge ${debt > 0 ? "badge--danger" : "badge--success"}`}>
                    {debt > 0 ? "Con deuda" : "Sin deuda"}
                  </span>
                </div>

                <div className="catalog-card__meta">
                  <span>Deuda: {formatCurrency(debt)}</span>
                </div>

                <div className="inline-actions">
                  <Link className="button button--secondary" to={`/clients/${client.id}`}>
                    Ver deuda
                  </Link>
                  <button className="button button--secondary" onClick={() => openEdit(client)} type="button">
                    Editar
                  </button>
                  <button className="button button--ghost" onClick={() => void removeClient(client.id)} type="button">
                    Eliminar
                  </button>
                </div>
              </article>
            );
          })}

          {filteredClients.length === 0 && (
            <div className="empty-state">No hay clientes para el filtro actual.</div>
          )}
        </div>
      </Panel>

      <Modal
        open={modalOpen}
        title={draft.id ? "Editar cliente" : "Nuevo cliente"}
        onClose={() => setModalOpen(false)}
      >
        <form className="form-grid" onSubmit={saveClient}>
          <label className="field">
            <span>Nombre</span>
            <input
              required
              value={draft.nombre}
              onChange={(event) => setDraft({ ...draft, nombre: event.target.value })}
            />
          </label>

          <label className="field">
            <span>Teléfono</span>
            <input
              value={draft.telefono}
              onChange={(event) => setDraft({ ...draft, telefono: event.target.value })}
            />
          </label>

          <div className="modal__footer">
            <button className="button button--secondary" onClick={() => setModalOpen(false)} type="button">
              Cancelar
            </button>
            <button className="button button--primary" type="submit">
              Guardar cliente
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
