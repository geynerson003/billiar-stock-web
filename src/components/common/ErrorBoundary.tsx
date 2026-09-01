import { Component, type ErrorInfo, type ReactNode } from "react";
import { isChunkLoadError, reportError } from "../../shared/utils";
import { ErrorPage } from "./ErrorPage";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** `root` = envuelve toda la app; `content` = solo el área bajo el AppShell. */
  level?: "root" | "content";
  /** Si cambia cualquiera de estas claves, el boundary se resetea. */
  resetKeys?: unknown[];
  /** Fallback personalizado; si no se pasa, se usa `<ErrorPage>`. */
  fallback?: (args: { error: Error; reset: () => void }) => ReactNode;
  /** Pasado a `<ErrorPage>` para mostrar "Cerrar sesión" en el fallback. */
  onLogout?: () => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/** Comparación superficial por índice de dos arrays de reset keys. */
function keysChanged(a?: unknown[], b?: unknown[]): boolean {
  if (a === b) return false;
  if (!a || !b || a.length !== b.length) return true;
  return a.some((value, index) => !Object.is(value, b[index]));
}

/**
 * Captura errores de render de su subárbol y muestra una pantalla de error en
 * vez de dejar la app en blanco. React no ofrece esto como hook, tiene que ser
 * una clase.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    reportError(error, { level: this.props.level ?? "content", componentStack: info.componentStack });
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.state.error && keysChanged(prevProps.resetKeys, this.props.resetKeys)) {
      this.setState({ error: null });
    }
  }

  reset(): void {
    this.setState({ error: null });
  }

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback({ error, reset: this.reset });
    }

    const variant = isChunkLoadError(error) ? "update-required" : "crash";
    return (
      <ErrorPage
        variant={variant}
        onRetry={this.reset}
        onLogout={this.props.onLogout}
        detail={error.stack}
      />
    );
  }
}
