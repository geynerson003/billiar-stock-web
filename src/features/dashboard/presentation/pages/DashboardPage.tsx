import { useMemo } from "react";
import { Link } from "react-router-dom";
import { BarChart, PageHeader, Panel, StatCard } from "../../../../shared/components";
import { useAuth, useLiveCollection } from "../../../../shared/hooks";
import {
  businessCollection,
  mapClient,
  mapExpense,
  mapProduct,
  mapSale,
} from "../../../../shared/services/firebase/business.service";
import { buildDashboardSummary } from "../../../../shared/utils/financial";
import { formatCurrency } from "../../../../shared/utils/format";

export function DashboardPage() {
  const { user, profile } = useAuth();
  const userId = user?.uid;

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

  return (
    <div className="page">
      <PageHeader
        eyebrow="Panel ejecutivo"
        title={`Hola${profile?.businessName ? `, ${profile.businessName}` : ""}`}
        description="Tu centro de mando para ingresos, gastos, stock y deudas en tiempo real."
      />

      <div className="stats-grid">
        <StatCard
          label="Ingresos netos"
          value={formatCurrency(summary.totalIncome - summary.totalExpenses)}
          tone="green"
        />
        <StatCard
          label="Gastos"
          value={formatCurrency(summary.totalExpenses)}
          tone="red"
        />
        <StatCard
          label="Ganancia neta"
          value={formatCurrency(summary.netProfit)}
          tone="blue"
        />
        <StatCard
          label="Deuda de clientes"
          value={formatCurrency(summary.totalDebt)}
          tone="orange"
        />
      </div>

      <div className="dashboard-grid">
        <Panel
          className="dashboard-panel dashboard-panel--blue"
          title="Pulso financiero"
          subtitle="Ultimos 7 dias de utilidad estimada"
        >
          <BarChart title="Comportamiento semanal" data={summary.chartData} />
        </Panel>

        <Panel
          className="dashboard-panel dashboard-panel--green"
          title="Top productos"
        >
          <div className="stack-list">
            {summary.topProducts.length === 0 && (
              <div className="empty-state">Todavia no hay suficientes ventas para rankear productos.</div>
            )}
            {summary.topProducts.map((product) => (
              <div className="list-row" key={product.name}>
                <div>
                  <strong>{product.name}</strong>
                  <span>Producto mas vendido</span>
                </div>
                <strong>{product.quantity}</strong>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          className="dashboard-panel dashboard-panel--orange"
          title="Alertas de stock"
        >
          <div className="stack-list">
            {summary.lowStockAlerts.length === 0 && (
              <div className="empty-state">No hay alertas criticas de inventario.</div>
            )}
            {summary.lowStockAlerts.map((product) => (
              <div className="list-row" key={product.id}>
                <div>
                  <strong>{product.name}</strong>
                  <span>Minimo {product.minStock} unidades</span>
                </div>
                <strong>{product.stock}</strong>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          className="dashboard-panel dashboard-panel--primary"
          title="Acciones rapidas"
          subtitle="Flujos centrales del sistema"
        >
          <div className="shortcut-grid">
            <Link className="shortcut-card" to="/inventory">
              <strong>Inventario</strong>
              <span>Gestion de productos y stock.</span>
            </Link>
            <Link className="shortcut-card" to="/clients">
              <strong>Clientes</strong>
              <span>Seguimiento de deuda y pagos.</span>
            </Link>
            <Link className="shortcut-card" to="/tables">
              <strong>Mesas y partidas</strong>
              <span>Juegos, participantes y apuestas.</span>
            </Link>
            <Link className="shortcut-card" to="/expenses">
              <strong>Gastos</strong>
              <span>Control de egresos del negocio.</span>
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}
