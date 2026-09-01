import type { ReactNode } from "react";
import {
  getErrorVariant,
  type ErrorIconName,
  type ErrorVariant,
} from "../../shared/feedback";

interface ErrorPageProps {
  /** Variante del catálogo (`src/shared/feedback/error-variants.ts`). */
  variant: ErrorVariant;
  /** Sobreescribe el título del catálogo. */
  title?: string;
  /** Sobreescribe el mensaje del catálogo. */
  message?: string;
  /** Handler del botón primario cuando la acción es `retry`. */
  onRetry?: () => void;
  /** Si se pasa (y la variante lo pide), muestra "Cerrar sesión". */
  onLogout?: () => void;
  /** Acciones extra ya construidas por el caller (nodos `<a>` / `<button>`). */
  actions?: ReactNode;
  /** Detalle técnico (`error.stack`); solo se muestra en desarrollo. */
  detail?: string;
  /**
   * Versión embebida para usarse dentro del `AppShell` (404): menos altura,
   * sin fondo a pantalla completa.
   */
  inline?: boolean;
}

/* ── Iconos SVG por variante (mismo estilo que toast.provider.tsx) ── */
const icons: Record<ErrorIconName, ReactNode> = {
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  "alert-triangle": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  "wifi-off": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" /><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" /><path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
      <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  ),
  download: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
};

/**
 * Pantalla de error presentacional. NO usa hooks de router ni de contexto, para
 * poder renderizarse desde el `ErrorBoundary` raíz (fuera de `<BrowserRouter>` y
 * de los providers). La navegación se hace con `<a href>` y `location.reload()`.
 */
export function ErrorPage({
  variant,
  title,
  message,
  onRetry,
  onLogout,
  actions,
  detail,
  inline = false,
}: ErrorPageProps) {
  const copy = getErrorVariant(variant);
  const resolvedTitle = title ?? copy.title;
  const resolvedMessage = message ?? copy.message;

  function handlePrimary() {
    switch (copy.primaryAction) {
      case "reload":
        window.location.reload();
        break;
      case "retry":
        if (onRetry) onRetry();
        else window.location.reload();
        break;
      case "back":
        window.history.back();
        break;
      case "home":
        window.location.assign("/");
        break;
    }
  }

  const primaryButton =
    copy.primaryAction === "home" ? (
      <a className="button button--primary" href="/">
        {copy.primaryCta}
      </a>
    ) : (
      <button className="button button--primary" type="button" onClick={handlePrimary}>
        {copy.primaryCta}
      </button>
    );

  return (
    <div
      className={[
        "error-screen",
        inline ? "error-screen--inline" : "",
        `error-screen--${variant}`,
      ]
        .filter(Boolean)
        .join(" ")}
      role="alert"
    >
      <div className="error-screen__icon">{icons[copy.icon]}</div>
      {copy.code && <span className="error-screen__code">Error {copy.code}</span>}
      <h1 className="error-screen__title">{resolvedTitle}</h1>
      <p className="error-screen__message">{resolvedMessage}</p>

      <div className="error-screen__actions">
        {primaryButton}
        {copy.showLogout && onLogout && (
          <button className="button button--secondary" type="button" onClick={onLogout}>
            Cerrar sesión
          </button>
        )}
        {actions}
      </div>

      {detail && import.meta.env.DEV && (
        <details className="error-screen__detail">
          <summary>Detalle técnico</summary>
          <pre>{detail}</pre>
        </details>
      )}
    </div>
  );
}
