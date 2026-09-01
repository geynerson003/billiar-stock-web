import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Modal, PageHeader, QueryError, useConfirmDialog } from "../../../../shared/components";
import { useAsyncAction, useAuth, useBusinessId, useLiveCollection, usePermissions, useToast } from "../../../../shared/hooks";
import type { Client } from "../../../../shared/types";
import {
  addOrUpdateClient,
  businessCollection,
  deleteClient,
  mapClient,
  mapPayment,
  mapSale,
  registerPayment,
} from "../../../../shared/services/firebase/business.service";
import { calculatePendingDebt, getSaleAmount } from "../../../../shared/utils/financial";
import { formatCurrency, formatPhone, formatShortDate } from "../../../../shared/utils/format";

const blankClient: Client = {
  id: "",
  nombre: "",
  telefono: "",
  deuda: 0,
  deudaOriginal: 0,
  totalPagado: 0,
};

export function ClientsPage() {
  const { actorId } = useAuth();
  const { can } = usePermissions();
  const { toast } = useToast();
  const { run: runAction } = useAsyncAction();
  const userId = useBusinessId(); // businessId efectivo (uid del dueño)
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<Client>(blankClient);
  const [confirmDialog, confirm] = useConfirmDialog();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");

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
  const payments = useLiveCollection(
    () => (userId ? businessCollection(userId, "payments") : null),
    [userId],
    mapPayment
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

  const selectedClient = useMemo(
    () =>
      filteredClients.find((client) => client.id === selectedId) ??
      filteredClients[0] ??
      null,
    [filteredClients, selectedId]
  );

  useEffect(() => {
    if (selectedClient && selectedClient.id !== selectedId) {
      setSelectedId(selectedClient.id);
      setPayAmount("");
    }
  }, [selectedClient, selectedId]);

  const debtInfo = useMemo(
    () =>
      selectedClient
        ? calculatePendingDebt(selectedClient.id, sales.data, clients.data, payments.data)
        : null,
    [selectedClient, sales.data, clients.data, payments.data]
  );

  const lastMovement = useMemo(() => {
    if (!selectedClient) return null;
    const dates = [
      ...sales.data.filter((s) => s.clientId === selectedClient.id).map((s) => s.date),
      ...payments.data.filter((p) => p.clientId === selectedClient.id).map((p) => p.date),
    ];
    return dates.length > 0 ? Math.max(...dates) : null;
  }, [selectedClient, sales.data, payments.data]);

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
    if (!userId || !can("clients.edit")) return;
    await runAction(() => addOrUpdateClient(userId, draft), {
      success: draft.id ? "Cliente actualizado" : "Cliente creado con éxito",
      errorFallbackId: "clients.save.error",
      onSuccess: () => setModalOpen(false),
    });
  }

  async function removeClient(clientId: string) {
    if (!userId || !can("clients.delete")) return;
    const confirmed = await confirm({
      title: "Eliminar cliente",
      message: "¿Estás seguro de eliminar este cliente?",
      confirmLabel: "Eliminar",
    });
    if (!confirmed) return;
    await runAction(() => deleteClient(userId, clientId), {
      success: "clients.delete.success",
      errorFallbackId: "clients.delete.error",
    });
  }

  async function submitPayment(event: FormEvent) {
    event.preventDefault();
    if (!userId || !selectedClient || !can("clients.payments")) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) {
      toast("warning", "Ingresa un monto válido.");
      return;
    }
    if (amount > (debtInfo?.remainingDebt ?? 0)) {
      toast("warning", "El monto supera la deuda pendiente del cliente.");
      return;
    }
    await runAction(
      () => registerPayment(userId, selectedClient.id, amount, "", "", actorId ?? undefined),
      {
        success: "debt.pay.success",
        errorFallbackId: "debt.pay.error",
        onSuccess: () => setPayAmount(""),
      }
    );
  }

  const selectedDebt = selectedClient
    ? selectedClient.deuda > 0
      ? selectedClient.deuda
      : pendingDebtMap.get(selectedClient.id) ?? 0
    : 0;

  return (
    <div className="page page-themed page-themed--clients">
      {confirmDialog}

      <PageHeader
        eyebrow="Clientes"
        title="Deudas y pagos"
        description="Gestiona tus clientes y sus deudas."
        actions={
          <div className="inline-actions">
            <input
              className="search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar cliente…"
            />
            {can("clients.edit") && (
              <button className="button button--primary" onClick={openCreate} type="button">
                Nuevo cliente
              </button>
            )}
          </div>
        }
      />

      <QueryError error={clients.error} />

      <div className="master-detail master-detail--clients">
        <div className="data-list">
          <div className="data-list__head">
            <span>{filteredClients.length} registros</span>
            <span>Deuda</span>
          </div>

          {filteredClients.map((client) => {
            const debt = client.deuda > 0 ? client.deuda : pendingDebtMap.get(client.id) ?? 0;
            return (
              <button
                type="button"
                key={client.id}
                className={`data-list__row${
                  client.id === selectedClient?.id ? " data-list__row--selected" : ""
                }`}
                onClick={() => setSelectedId(client.id)}
              >
                <span className="data-list__row-top">
                  <strong>{client.nombre}</strong>
                  <span
                    className="data-list__row-price"
                    style={{ color: debt > 0 ? "var(--orange)" : "var(--muted)" }}
                  >
                    {debt > 0 ? formatCurrency(debt) : "Al día"}
                  </span>
                </span>
                <span className="data-list__row-sub">
                  <span style={{ color: "var(--muted)", fontSize: "0.82rem" }}>
                    {formatPhone(client.telefono)}
                  </span>
                </span>
              </button>
            );
          })}

          {filteredClients.length === 0 && (
            <div className="empty-state">No hay clientes para el filtro actual.</div>
          )}
        </div>

        {selectedClient && (
          <aside className="detail-aside">
            <div className="detail-aside__eyebrow">Estado de cuenta</div>
            <div className="detail-aside__name">{selectedClient.nombre}</div>
            <div
              className="detail-aside__amount"
              style={{ color: selectedDebt > 0 ? "var(--orange)" : "var(--green)" }}
            >
              {selectedDebt > 0 ? formatCurrency(selectedDebt) : "Sin deuda"}
            </div>

            <div className="detail-row">
              <span>Teléfono</span>
              <strong>{formatPhone(selectedClient.telefono)}</strong>
            </div>
            <div className="detail-row">
              <span>Ventas pendientes</span>
              <strong>{debtInfo?.pendingSales.length ?? 0}</strong>
            </div>
            <div className="detail-row">
              <span>Último movimiento</span>
              <strong>{lastMovement ? formatShortDate(lastMovement) : "—"}</strong>
            </div>
            <div className="detail-row">
              <span>Total pagado</span>
              <strong>{formatCurrency(debtInfo?.totalPaid ?? 0)}</strong>
            </div>

            {can("clients.payments") && (
              <form className="inline-actions" onSubmit={submitPayment} style={{ marginTop: "var(--sp-5)" }}>
                <input
                  className="search-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={payAmount}
                  onChange={(event) => setPayAmount(event.target.value)}
                  placeholder="Monto a abonar"
                />
                <button className="button button--primary" type="submit">
                  Registrar
                </button>
              </form>
            )}

            <div className="detail-aside__actions">
              <Link className="button button--secondary" to={`/clients/${selectedClient.id}`}>
                Ver historial completo
              </Link>
              {can("clients.edit") && (
                <button
                  className="button button--secondary"
                  onClick={() => openEdit(selectedClient)}
                  type="button"
                >
                  Editar
                </button>
              )}
              {can("clients.delete") && (
                <button
                  className="button button--ghost"
                  onClick={() => void removeClient(selectedClient.id)}
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
