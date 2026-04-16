import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { useAuth } from "../../shared/hooks";

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="screen-loader">
        <div className="screen-loader__icon">BS</div>
        <div className="screen-loader__bar" />
        <span className="screen-loader__text">Cargando experiencia web…</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <AppShell />;
}

export function GuestRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="screen-loader">
        <div className="screen-loader__icon">BS</div>
        <div className="screen-loader__bar" />
        <span className="screen-loader__text">Cargando experiencia web…</span>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
