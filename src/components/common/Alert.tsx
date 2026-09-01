import type { ReactNode } from "react";

interface AlertProps {
  variant?: "error" | "success" | "info" | "warning";
  children: ReactNode;
  /** Si se pasa, muestra un botón "×" que lo invoca. */
  onClose?: () => void;
  className?: string;
}

/**
 * Mensaje en línea (no flotante) para errores de carga, avisos de formulario, etc.
 * Envuelve las clases `.alert` / `.alert--*` del design system.
 */
export function Alert({ variant = "error", children, onClose, className }: AlertProps) {
  return (
    <div
      className={["alert", `alert--${variant}`, className].filter(Boolean).join(" ")}
      role={variant === "error" || variant === "warning" ? "alert" : "status"}
    >
      <span className="alert__body">{children}</span>
      {onClose && (
        <button className="alert__close" type="button" aria-label="Cerrar" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
