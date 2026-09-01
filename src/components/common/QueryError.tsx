import { useOnlineStatus } from "../../shared/hooks/use-online-status";
import { feedbackText } from "../../shared/feedback";
import { Alert } from "./Alert";

interface QueryErrorProps {
  /** El `error` que devuelve `useLiveCollection` / `useLiveDocument` (ya traducido). */
  error: string | null;
  /** Si se pasa, muestra un botón "Reintentar". */
  onRetry?: () => void;
}

/**
 * Muestra el error de una suscripción en tiempo real bajo el encabezado de la
 * página. No renderiza nada si no hay error.
 */
export function QueryError({ error, onRetry }: QueryErrorProps) {
  const online = useOnlineStatus();
  if (!error) return null;

  const text = online ? error : feedbackText("generic.offline");

  return (
    <Alert variant={online ? "error" : "warning"}>
      {text}
      {onRetry && (
        <button
          className="button button--ghost"
          type="button"
          onClick={onRetry}
          style={{ marginLeft: "var(--sp-3)" }}
        >
          Reintentar
        </button>
      )}
    </Alert>
  );
}
