interface BarChartProps {
  title: string;
  data: Array<{ label: string; value: number }>;
}

export function BarChart({ title, data }: BarChartProps) {
  // Filtrar datos válidos y calcular el máximo valor
  const validData = data.filter(item => Number.isFinite(item.value));
  const maxValue = Math.max(
    Math.max(...validData.map((item) => Math.abs(item.value)), 1),
    1
  );

  if (validData.length === 0) {
    return (
      <div className="mini-chart">
        <div className="mini-chart__header">
          <h4>{title}</h4>
        </div>
        <div className="empty-state">No hay datos disponibles para el gráfico.</div>
      </div>
    );
  }

  return (
    <div className="mini-chart">
      <div className="mini-chart__header">
        <h4>{title}</h4>
      </div>
      <div className="mini-chart__bars">
        {validData.map((item) => (
          <div
            className="mini-chart__item"
            key={item.label}
          >
            <div
              className={`mini-chart__bar ${
                item.value < 0 ? "mini-chart__bar--negative" : ""
              }`}
              style={{
                height: `${Math.max((Math.abs(item.value) / maxValue) * 100, item.value === 0 ? 2 : 8)}%`
              }}
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
