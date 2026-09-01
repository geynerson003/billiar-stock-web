import { useState } from "react";

interface BarChartProps {
  data: Array<{ label: string; value: number }>;
  formatValue?: (value: number) => string;
}

export function BarChart({ data, formatValue }: BarChartProps) {
  const validData = data.filter((item) => Number.isFinite(item.value));
  const maxValue = Math.max(...validData.map((item) => Math.abs(item.value)), 1);

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (validData.length === 0) {
    return (
      <div className="mini-chart">
        <div className="empty-state">No hay datos disponibles para el gráfico.</div>
      </div>
    );
  }

  const activeIndex =
    hoverIndex != null && hoverIndex < validData.length
      ? hoverIndex
      : validData.length - 1;

  return (
    <div className="mini-chart">
      {formatValue && (
        <div className="mini-chart__header">
          <span className="mini-chart__value">
            {validData[activeIndex].label} · {formatValue(validData[activeIndex].value)}
          </span>
        </div>
      )}
      <div className="mini-chart__bars">
        {validData.map((item, index) => (
          <div
            className="mini-chart__item"
            key={`${item.label}-${index}`}
            onMouseEnter={() => setHoverIndex(index)}
            onMouseLeave={() => setHoverIndex(null)}
            onClick={() => setHoverIndex(index)}
          >
            <div
              className={`mini-chart__bar${
                item.value < 0 ? " mini-chart__bar--negative" : ""
              }${index === activeIndex ? " mini-chart__bar--active" : ""}`}
              style={{
                height: `${Math.max(
                  (Math.abs(item.value) / maxValue) * 100,
                  item.value === 0 ? 2 : 8
                )}%`,
              }}
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
