import { useId, type SelectHTMLAttributes } from "react";
import {
  PRINTERS,
  getPrinterFormatOption,
  type PrinterFormatId
} from "../../shared/constants/printer";

type PrinterFormatSelectProps = {
  label: string;
  value: PrinterFormatId;
  onChange: (value: PrinterFormatId) => void;
  /** Muestra la descripción del formato seleccionado bajo el selector. */
  showHint?: boolean;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange">;

export function PrinterFormatSelect({
  label,
  value,
  onChange,
  showHint = true,
  id,
  ...selectProps
}: PrinterFormatSelectProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hint = getPrinterFormatOption(value).description;

  return (
    <label className="field" htmlFor={fieldId}>
      <span>{label}</span>
      <select
        id={fieldId}
        value={value}
        onChange={(event) => onChange(event.target.value as PrinterFormatId)}
        {...selectProps}
      >
        {PRINTERS.map((printer) => (
          <option key={printer.id} value={printer.id}>
            {printer.name}
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
