import { useId, type SelectHTMLAttributes } from "react";
import { SCANNER_MODES, getScannerModeOption, type ScannerModeId } from "../../shared/constants/scanner";

type ScannerModeSelectProps = {
  label: string;
  value: ScannerModeId;
  onChange: (value: ScannerModeId) => void;
  /** Muestra la descripción del modo seleccionado bajo el selector. */
  showHint?: boolean;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange">;

export function ScannerModeSelect({
  label,
  value,
  onChange,
  showHint = true,
  id,
  ...selectProps
}: ScannerModeSelectProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hint = getScannerModeOption(value).description;

  return (
    <label className="field" htmlFor={fieldId}>
      <span>{label}</span>
      <select
        id={fieldId}
        value={value}
        onChange={(event) => onChange(event.target.value as ScannerModeId)}
        {...selectProps}
      >
        {SCANNER_MODES.map((mode) => (
          <option key={mode.id} value={mode.id}>
            {mode.name}
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
