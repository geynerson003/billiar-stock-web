import { useId, useState, type InputHTMLAttributes } from "react";

type PasswordFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange"
>;

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

export function PasswordField({
  label,
  value,
  onChange,
  id,
  ...inputProps
}: PasswordFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <label className="field field--password" htmlFor={fieldId}>
      <span>{label}</span>
      <div className="field__password-wrap">
        <input
          id={fieldId}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          {...inputProps}
        />
        <button
          type="button"
          className="field__password-toggle"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          tabIndex={-1}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </label>
  );
}
