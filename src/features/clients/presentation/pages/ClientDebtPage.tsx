import { useMemo, useState, type FormEvent } from "react";
import { doc } from "firebase/firestore";
import { useParams } from "react-router-dom";
import { PageHeader, Panel } from "../../../../shared/components";
import { useAuth, useLiveCollection, useLiveDocument, useToast } from "../../../../shared/hooks";
import {
  businessCollection,
  defaultClient,
  mapPayment,
  mapSale,
  mapTable,
  registerPayment,
} from "../../../../shared/services/firebase/business.service";
import { db } from "../../../../shared/services/firebase/config";
import { calculatePendingDebt, getSaleAmount } from "../../../../shared/utils/financial";
import { formatCurrency, formatDate } from "../../../../shared/utils/format";

export function ClientDebtPage() {
  const { clientId = "" } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const userId = user?.uid;
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  const client = useLiveDocument(
    () => (userId && clientId ? doc(db, "businesses", userId, "clients", clientId) : null),
    [clientId, userId],
    (snapshot) => {
      if (!snapshot.exists()) return null;
      return {
        ...defaultClient,
        ...(snapshot.data() ?? {}),
        id: snapshot.id,
      };
    }
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
  const tables = useLiveCollection(
    () => (userId ? businessCollection(userId, "tables") : null),
    [userId],
    mapTable
  );

  const debtInfo = useMemo(() => {
    if (!client.data) return null;
    return calculatePendingDebt(client.data.id, sales.data, [client.data], payments.data);
  }, [client.data, payments.data, sales.data]);

  const clientPayments = useMemo(
    () =>
      payments.data
        .filter((payment) => payment.clientId === clientId)
        .sort((a, b) => b.date - a.date),
    [clientId, payments.data]
  );

  async function payDebt(event: FormEvent) {
    event.preventDefault();
    if (!userId || !client.data || !amount) return;

    const numAmount = Number(amount);
    const maxDebt = debtInfo?.remainingDebt ?? 0;

    if (numAmount > maxDebt) {
      toast("warning", `El monto no puede ser mayor a la deuda restante (${formatCurrency(maxDebt)})`);
      return;
    }

    await registerPayment(userId, client.data.id, numAmount, description, notes);
    toast("success", `Pago de ${formatCurrency(numAmount)} registrado`);
    setAmount("");
    setDescription("");
    setNotes("");
  }

  if (client.loading) {
    return (
      <div className="page">
        <PageHeader
          eyebrow="Detalle de cliente"
          title="Cargando cliente"
          description="Estamos consultando el historial del cliente."
        />
        <Panel title="Cargando">
          <div className="empty-state">Un momento, estamos cargando la información.</div>
        </Panel>
      </div>
    );
  }

  if (!client.data) {
    return (
      <div className="page">
        <PageHeader
          eyebrow="Detalle de cliente"
          title="Cliente no encontrado"
          description="El registro ya no existe o no está disponible en este negocio."
        />
        <Panel title="Sin información">
          <div className="empty-state">Revisa el listado de clientes y vuelve a entrar desde ahí.</div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Detalle de cliente"
        title={client.data.nombre}
        description="Resumen de ventas pendientes, historial de pagos y saldo restante."
      />

      <div className="stats-grid">
        <div className="stat-card stat-card--orange">
          <span className="stat-card__label">Deuda restante</span>
          <strong className="stat-card__value">{formatCurrency(debtInfo?.remainingDebt ?? 0)}</strong>
        </div>
        <div className="stat-card stat-card--green">
          <span className="stat-card__label">Total pagado</span>
          <strong className="stat-card__value">{formatCurrency(debtInfo?.totalPaid ?? 0)}</strong>
        </div>
        <div className="stat-card stat-card--blue">
          <span className="stat-card__label">Ventas pendientes</span>
          <strong className="stat-card__value">{debtInfo?.pendingSales.length ?? 0}</strong>
        </div>
      </div>

      <div className="dashboard-grid">
        <Panel title="Registrar pago">
          <form className="form-grid" onSubmit={payDebt}>
            <label className="field">
              <span>Monto</span>
              <input
                required
                min="0"
                type="number"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label>

            <label className="field">
              <span>Descripción</span>
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Pago parcial o total"
              />
            </label>

            <label className="field field--full">
              <span>Notas</span>
              <textarea
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Observaciones del pago"
              />
            </label>

            <div className="modal__footer">
              <button className="button button--primary" type="submit">
                Registrar pago
              </button>
            </div>
          </form>
        </Panel>

        <Panel title="Ventas pendientes">
          <div className="stack-list">
            {debtInfo?.pendingSales.map((sale) => (
              <div className="list-row list-row--expanded" key={sale.id}>
                <div>
                  <strong>{tables.data.find((table) => table.id === sale.tableId)?.name ?? "Venta externa"}</strong>
                  <span>{formatDate(sale.date)}</span>
                </div>
                <strong>{formatCurrency(getSaleAmount(sale))}</strong>
              </div>
            ))}
            {!debtInfo?.pendingSales.length && (
              <div className="empty-state">No hay ventas pendientes para este cliente.</div>
            )}
          </div>
        </Panel>

        <Panel title="Historial de pagos">
          <div className="stack-list">
            {clientPayments.map((payment) => (
              <div className="list-row" key={payment.id}>
                <div>
                  <strong>{payment.description || "Pago de deuda"}</strong>
                  <span>{formatDate(payment.date)}</span>
                </div>
                <strong>{formatCurrency(payment.amount)}</strong>
              </div>
            ))}
            {clientPayments.length === 0 && (
              <div className="empty-state">Este cliente todavía no tiene pagos registrados.</div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
