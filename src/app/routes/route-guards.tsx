import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { ErrorPage } from "../../shared/components/common";
import { isKnownMarket } from "../../shared/constants";
import type { Permission } from "../../shared/constants";
import { useAuth, useMarket, usePermissions } from "../../shared/hooks";
import { SelectMarketPage } from "../../features/settings/presentation/pages";
import { NO_ACCESS_PATH, ROUTE_ACCESS } from "./route-access";

function ScreenLoader() {
  return (
    <div className="screen-loader">
      <div className="screen-loader__icon">MN</div>
      <div className="screen-loader__bar" />
      <span className="screen-loader__text">Cargando experiencia web…</span>
    </div>
  );
}

function AccountDisabledScreen() {
  const { logout } = useAuth();
  return (
    <ErrorPage
      variant="forbidden"
      title="Cuenta desactivada"
      message="Tu cuenta de empleado está desactivada. Contacta al administrador del negocio."
      onLogout={() => void logout()}
    />
  );
}

/** Ruta desconocida estando autenticado. Se renderiza dentro del AppShell. */
export function NotFoundScreen() {
  return <ErrorPage variant="not-found" inline />;
}

export function ProtectedRoute() {
  const { user, loading, profile, profileLoaded } = useAuth();

  if (loading) {
    return <ScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Espera a que el perfil emita al menos una vez antes de decidir el gate.
  if (!profileLoaded) {
    return <ScreenLoader />;
  }

  const isEmployee = profile?.role === "employee";

  // Empleado desactivado (o doc-espejo viejo tras rotar la contraseña).
  if (isEmployee && profile?.isActive === false) {
    return <AccountDisabledScreen />;
  }

  // El gate de tipo de negocio es solo para dueños; el empleado hereda el mercado.
  if (!isEmployee && profile && !isKnownMarket(profile.market)) {
    return <SelectMarketPage />;
  }

  return <AppShell />;
}

export function GuestRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <ScreenLoader />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

/**
 * Restringe una ruta a los mercados donde la feature indicada está activa.
 * Si está apagada (p. ej. `tables` para tiendas), redirige al inicio.
 */
export function MarketFeatureRoute({
  feature,
  children,
}: {
  feature: keyof ReturnType<typeof useMarket>["features"];
  children: ReactNode;
}) {
  const market = useMarket();

  if (!market.features[feature]) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

/**
 * Primera ruta que el actor tiene permiso de ver, siguiendo el orden del menú.
 * Se usa como destino de redirección cuando cae en una ruta sin permiso.
 */
export function useFirstAllowedPath(): string {
  const { can, isAdmin } = usePermissions();
  const market = useMarket();

  for (const entry of ROUTE_ACCESS) {
    if (entry.feature && !market.features[entry.feature]) continue;
    const allowed = entry.permission === "ADMIN_ONLY" ? isAdmin : can(entry.permission);
    if (allowed) return entry.path;
  }
  return NO_ACCESS_PATH;
}

/** Guard por permiso (o exclusivo de admin). Análogo a `MarketFeatureRoute`. */
export function PermissionRoute({
  perm,
  children,
}: {
  perm: Permission | "ADMIN_ONLY";
  children: ReactNode;
}) {
  const { can, isAdmin } = usePermissions();
  const fallback = useFirstAllowedPath();

  const ok = perm === "ADMIN_ONLY" ? isAdmin : can(perm);
  if (!ok) {
    return <Navigate to={fallback} replace />;
  }
  return <>{children}</>;
}

export function NoAccessScreen() {
  const { logout } = useAuth();
  return (
    <ErrorPage
      variant="forbidden"
      message="No tienes permisos para ver ninguna sección. Contacta al administrador."
      onLogout={() => void logout()}
    />
  );
}
