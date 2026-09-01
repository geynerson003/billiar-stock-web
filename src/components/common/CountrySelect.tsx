import { useId, type SelectHTMLAttributes } from "react";
import { LATAM_COUNTRIES } from "../../shared/constants";

type CountrySelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
} & Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "value" | "onChange"
>;

export function CountrySelect({
  label,
  value,
  onChange,
  id,
  ...selectProps
}: CountrySelectProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <label className="field" htmlFor={fieldId}>
      <span>{label}</span>
      <select
        id={fieldId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...selectProps}
      >
        {LATAM_COUNTRIES.map((country) => (
          <option key={country.code} value={country.code}>
            {country.name} ({country.currency})
          </option>
        ))}
      </select>
    </label>
  );
}
