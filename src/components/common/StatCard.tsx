interface StatCardProps {
  label: string;
  value: string;
  tone?: "blue" | "green" | "orange" | "red";
  helper?: string;
}

export function StatCard({
  label,
  value,
  tone = "blue",
  helper
}: StatCardProps) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <span className="stat-card__label">{label}</span>
      <strong className="stat-card__value">{value}</strong>
      {helper && <small className="stat-card__helper">{helper}</small>}
    </article>
  );
}
