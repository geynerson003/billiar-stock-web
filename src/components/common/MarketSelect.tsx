import { useId, type SelectHTMLAttributes } from "react";
import { MARKETS, getMarketOption } from "../../shared/constants";

type MarketSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Muestra la descripción del mercado seleccionado bajo el selector. */
  showHint?: boolean;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange">;

export function MarketSelect({
  label,
  value,
  onChange,
  showHint = true,
  id,
  ...selectProps
}: MarketSelectProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hint = getMarketOption(value).description;

  return (
    <label className="field" htmlFor={fieldId}>
      <span>{label}</span>
      <select
        id={fieldId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...selectProps}
      >
        {MARKETS.map((market) => (
          <option key={market.id} value={market.id}>
            {market.name}
          </option>
        ))}
      </select>
      {showHint && hint && (
        <span className="field__hint" style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
          {hint}
        </span>
      )}
    </label>
  );
}
