import { useMemo, useState } from "react";
import { PageHeader, Panel } from "../../../../shared/components";
import { useAuth, useLiveCollection } from "../../../../shared/hooks";
import type { ReportFilter, ReportType } from "../../../../shared/types";
import {
  businessCollection,
  mapClient,
  mapExpense,
  mapProduct,
  mapSale,
  mapTable,
} from "../../../../shared/services/firebase/business.service";
import { buildReport } from "../../../../shared/utils/financial";
import { formatCurrency } from "../../../../shared/utils/format";

export function ReportsPage() {
  const { user } = useAuth();
  const userId = user?.uid;
  const [filterType, setFilterType] = useState<ReportType>("DAILY");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
  const products = useLiveCollection(
    () => (userId ? businessCollection(userId, "products") : null),
    [userId],
    mapProduct
  );
  const tables = useLiveCollection(
    () => (userId ? businessCollection(userId, "tables") : null),
    [userId],
    mapTable
  );

  const filter: ReportFilter = useMemo(
    () => ({
      type: filterType,
      startDate: startDate ? new Date(startDate).getTime() : undefined,
      endDate: endDate ? new Date(endDate).getTime() + 86_399_999 : undefined,
    }),
    [endDate, filterType, startDate]
  );

  const report = useMemo(
    () => buildReport(filter, sales.data, expenses.data, clients.data, products.data, tables.data),
    [clients.data, expenses.data, filter, products.data, sales.data, tables.data]
  );

  return (
    <div className="page page-themed page-themed--reports">
      <PageHeader
        eyebrow="Reportes"
        title="Gestion de reportes"
        description="Gestiona tus reportes y obtén información valiosa para tomar decisiones."
      />

      <Panel title="Filtros">
        <div className="filter-grid">
          <label className="field">
            <span>Tipo</span>
            <select value={filterType} onChange={(event) => setFilterType(event.target.value as ReportType)}>
              <option value="DAILY">Diario</option>
              <option value="WEEKLY">Semanal</option>
              <option value="MONTHLY">Mensual</option>
              <option value="CUSTOM">Personalizado</option>
            </select>
          </label>

          {filterType === "CUSTOM" && (
            <>
              <label className="field">
                <span>Fecha inicio</span>
                <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              </label>
              <label className="field">
                <span>Fecha fin</span>
                <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
              </label>
            </>
          )}
        </div>
      </Panel>

      <div className="stats-grid">
        <div className="stat-card stat-card--green">
          <span className="stat-card__label">Ventas</span>
          <strong className="stat-card__value">{formatCurrency(report.totalSales)}</strong>
        </div>
        <div className="stat-card stat-card--red">
          <span className="stat-card__label">Gastos</span>
          <strong className="stat-card__value">{formatCurrency(report.totalExpenses)}</strong>
        </div>
        <div className="stat-card stat-card--blue">
          <span className="stat-card__label">Ganancia</span>
          <strong className="stat-card__value">{formatCurrency(report.netProfit)}</strong>
        </div>
        <div className="stat-card stat-card--orange">
          <span className="stat-card__label">Deuda clientes</span>
          <strong className="stat-card__value">{formatCurrency(report.totalClientDebt)}</strong>
        </div>
      </div>

      <div className="dashboard-grid">
        <Panel title="Ventas por mesa">
          <div className="stack-list">
            {Object.entries(report.salesByTable).map(([table, value]) => (
              <div className="list-row" key={table}>
                <span>{table}</span>
                <strong>{formatCurrency(value)}</strong>
              </div>
            ))}
            {Object.keys(report.salesByTable).length === 0 && (
              <div className="empty-state">No hay ventas por mesa para el periodo seleccionado.</div>
            )}
          </div>
        </Panel>

        <Panel title="Ventas por producto">
          <div className="stack-list">
            {Object.entries(report.salesByProduct).map(([product, value]) => (
              <div className="list-row" key={product}>
                <span>{product}</span>
                <strong>{formatCurrency(value)}</strong>
              </div>
            ))}
            {Object.keys(report.salesByProduct).length === 0 && (
              <div className="empty-state">No hay ventas por producto para este filtro.</div>
            )}
          </div>
        </Panel>

        <Panel title="Top productos">
          <div className="stack-list">
            {report.topProducts.map((product) => (
              <div className="list-row" key={product.name}>
                <span>{product.name}</span>
                <strong>{product.quantity}</strong>
              </div>
            ))}
            {report.topProducts.length === 0 && (
              <div className="empty-state">Todavia no hay productos rankeados en este rango.</div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
