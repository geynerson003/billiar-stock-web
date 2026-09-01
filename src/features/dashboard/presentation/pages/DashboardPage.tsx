import { useMemo } from "react";
import { BarChart, PageHeader, Panel, StatCard } from "../../../../shared/components";
import { useAuth, useBusinessId, useLiveCollection } from "../../../../shared/hooks";
import {
  businessCollection,
  mapClient,
  mapExpense,
  mapProduct,
  mapSale,
} from "../../../../shared/services/firebase/business.service";
import {
  buildDashboardDeltas,
  buildDashboardSummary,
  getSaleAmount,
} from "../../../../shared/utils/financial";
import { formatCurrency, getActiveLocale } from "../../../../shared/utils/format";

function formatPercent(value: number): string {
  const formatted = new Intl.NumberFormat(getActiveLocale(), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Math.abs(value));
  return `${formatted}%`;
}

export function DashboardPage() {
  const { profile } = useAuth();
  const userId = useBusinessId(); // businessId efectivo (uid del dueño)

  const products = useLiveCollection(
    () => (userId ? businessCollection(userId, "products") : null),
    [userId],
    mapProduct
  );
  const sales = useLiveCollection(
    () => (userId ? businessCollection(userId, "sales") : null),
    [userId],
    mapSale
  );
  const expenses = useLiveCollection(
    () => (userId ? businessCollection(userId, "expenses") : null),
    [userId],
    mapExpense
  );
  const clients = useLiveCollection(
    () => (userId ? businessCollection(userId, "clients") : null),
    [userId],
    mapClient
  );

  const summary = useMemo(
    () => buildDashboardSummary(sales.data, expenses.data, products.data, clients.data),
    [clients.data, expenses.data, products.data, sales.data]
  );

  const deltas = useMemo(
    () => buildDashboardDeltas(sales.data, expenses.data, products.data, clients.data),
    [clients.data, expenses.data, products.data, sales.data]
  );

  const pulseHasActivity = useMemo(
    () => summary.chartData.some((point) => point.value !== 0),
    [summary.chartData]
  );

  // El pulso solo cuenta ventas cobradas. Si el periodo tiene ventas a crédito
  // sin pagar, el gráfico queda plano y parecería vacío por error.
  const pendingLast7Days = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    const startMs = start.getTime();
    return sales.data
      .filter((sale) => !sale.isPaid && sale.date >= startMs)
      .reduce((sum, sale) => sum + getSaleAmount(sale), 0);
  }, [sales.data]);

  const incomeHelper =
    deltas.incomePct === null
      ? "Sin histórico previo"
      : `${deltas.incomePct >= 0 ? "↑" : "↓"} ${formatPercent(deltas.incomePct)} vs periodo anterior`;
  const expenseHelper =
    deltas.expensePct === null
      ? "Sin histórico previo"
      : `${deltas.expensePct >= 0 ? "↑" : "↓"} ${formatPercent(deltas.expensePct)} vs periodo anterior`;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Panel"
        title={`Hola${profile?.businessName ? `, ${profile.businessName}` : ""}`}
        description="Ingresos, gastos, stock y deudas en tiempo real."
      />

      <div className="stats-grid">
        <StatCard
          label="Ingresos netos"
          value={formatCurrency(summary.totalIncome - summary.totalExpenses)}
          tone="green"
          helper={incomeHelper}
          helperTone={
            deltas.incomePct === null ? "muted" : deltas.incomePct >= 0 ? "up" : "down"
          }
        />
        <StatCard
          label="Gastos"
          value={formatCurrency(summary.totalExpenses)}
          tone="red"
          helper={expenseHelper}
          helperTone={
            deltas.expensePct === null ? "muted" : deltas.expensePct <= 0 ? "up" : "down"
          }
        />
        <StatCard
          label="Ganancia neta"
          value={formatCurrency(summary.netProfit)}
          tone="blue"
          helper={`Margen ${formatPercent(deltas.profitMarginPct)}`}
          helperTone="muted"
        />
        <StatCard
          label="Deuda de clientes"
          value={formatCurrency(summary.totalDebt)}
          tone="orange"
          helper={`${deltas.clientsWithDebt} ${
            deltas.clientsWithDebt === 1 ? "cliente con saldo" : "clientes con saldo"
          }`}
          helperTone="muted"
        />
      </div>

      <div className="dashboard-hero">
        <Panel
          title="Pulso financiero"
          subtitle="Utilidad estimada, últimos 7 días"
        >
          <BarChart data={summary.chartData} formatValue={formatCurrency} />
          {!pulseHasActivity && pendingLast7Days > 0 && (
            <p className="mini-chart__note">
              {formatCurrency(pendingLast7Days)} en ventas pendientes de cobro en este
              periodo. El pulso solo refleja la utilidad de ventas ya cobradas.
            </p>
          )}
        </Panel>

        <div className="dashboard-hero__side">
          <Panel title="Más vendidos">
            <div className="stack-list">
              {summary.topProducts.length === 0 && (
                <div className="empty-state">Todavía no hay suficientes ventas para rankear productos.</div>
              )}
              {summary.topProducts.map((product) => (
                <div className="list-row" key={product.name}>
                  <div>
                    <strong>{product.name}</strong>
                    <span>Producto más vendido</span>
                  </div>
                  <strong>{product.quantity}</strong>
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            title="Alertas de stock"
            actions={<span className="badge">{summary.lowStockAlerts.length}</span>}
          >
            <div className="stack-list">
              {summary.lowStockAlerts.length === 0 && (
                <div className="empty-state">No hay alertas críticas de inventario.</div>
              )}
              {summary.lowStockAlerts.map((product) => (
                <div className="list-row" key={product.id}>
                  <div>
                    <strong>{product.name}</strong>
                    <span>Mínimo {product.minStock} unidades</span>
                  </div>
                  <strong className="text-danger">{product.stock}</strong>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
