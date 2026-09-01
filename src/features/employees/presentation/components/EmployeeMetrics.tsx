import { useMemo, useState } from "react";
import { Panel, StatCard } from "../../../../shared/components";
import { useBusinessId, useLiveCollection } from "../../../../shared/hooks";
import {
  businessCollection,
  mapExpense,
  mapPayment,
  mapProduct,
  mapSale,
} from "../../../../shared/services/firebase/business.service";
import { getDateRange } from "../../../../shared/utils/financial";
import { formatCurrency } from "../../../../shared/utils/format";
import type { ReportType } from "../../../../shared/types";
import { buildEmployeeMetrics, type DateWindow } from "../../utils/employee-metrics";

const RANGES: { id: ReportType | "ALL"; label: string }[] = [
  { id: "DAILY", label: "Hoy" },
  { id: "WEEKLY", label: "Semana" },
  { id: "MONTHLY", label: "Mes" },
  { id: "ALL", label: "Todo" },
];

export function EmployeeMetrics({ employeeId }: { employeeId: string }) {
  const businessId = useBusinessId();
  const [range, setRange] = useState<ReportType | "ALL">("MONTHLY");

  const sales = useLiveCollection(
    () => (businessId ? businessCollection(businessId, "sales") : null),
    [businessId],
    mapSale
  );
  const payments = useLiveCollection(
    () => (businessId ? businessCollection(businessId, "payments") : null),
    [businessId],
    mapPayment
  );
  const expenses = useLiveCollection(
    () => (businessId ? businessCollection(businessId, "expenses") : null),
    [businessId],
    mapExpense
  );
  const products = useLiveCollection(
    () => (businessId ? businessCollection(businessId, "products") : null),
    [businessId],
    mapProduct
  );

  const window: DateWindow | undefined = useMemo(() => {
    if (range === "ALL") return undefined;
    return getDateRange({ type: range });
  }, [range]);

  const metrics = useMemo(
    () =>
      buildEmployeeMetrics(
        employeeId,
        {
          sales: sales.data,
          payments: payments.data,
          expenses: expenses.data,
          products: products.data,
        },
        window
      ),
    [employeeId, sales.data, payments.data, expenses.data, products.data, window]
  );

  return (
    <Panel
      title="Desempeño"
      subtitle="Atribuido por quien registró cada movimiento"
      actions={
        <div className="range-chips">
          {RANGES.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={`range-chip${range === entry.id ? " range-chip--active" : ""}`}
              onClick={() => setRange(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="stats-grid">
        <StatCard
          label="Ventas"
          value={formatCurrency(metrics.salesTotal)}
          helper={`${metrics.salesCount} ventas`}
          tone="blue"
        />
        <StatCard
          label="Ganancia generada"
          value={formatCurrency(metrics.profitGenerated)}
          tone="green"
        />
        <StatCard
          label="Cobros de deuda"
          value={formatCurrency(metrics.paymentsTotal)}
          helper={`${metrics.paymentsCount} cobros`}
          tone="blue"
        />
        <StatCard
          label="Gastos registrados"
          value={formatCurrency(metrics.expensesTotal)}
          helper={`${metrics.expensesCount} gastos`}
          tone="orange"
        />
        <StatCard
          label="Fiado pendiente"
          value={formatCurrency(metrics.pendingSalesAmount)}
          helper={`${metrics.pendingSalesCount} ventas por cobrar`}
          tone="red"
        />
        <StatCard
          label="Aporte neto"
          value={formatCurrency(metrics.netContribution)}
          helper="Ganancia − gastos registrados"
          tone={metrics.netContribution >= 0 ? "green" : "red"}
        />
      </div>
    </Panel>
  );
}
