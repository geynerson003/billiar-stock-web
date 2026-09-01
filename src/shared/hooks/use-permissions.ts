import { useCallback, useMemo } from "react";
import type { Permission } from "../constants";
import { useAuth } from "./use-auth";

export interface PermissionsApi {
  /** El usuario es el dueño/administrador (tiene todos los permisos). */
  isAdmin: boolean;
  isEmployee: boolean;
  /** Conjunto de permisos concedidos (vacío para el admin: usa `can`). */
  permissions: ReadonlySet<string>;
  /**
   * True si el actor puede realizar la acción. El admin siempre puede.
   * Acepta un permiso o una lista (basta con tener uno).
   */
  can: (permission: Permission | Permission[]) => boolean;
}

/**
 * RBAC en la capa de presentación. El admin (`profile.role` ausente o `"admin"`)
 * siempre puede. Un empleado desactivado no puede nada.
 */
export function usePermissions(): PermissionsApi {
  const { role, permissions, isEmployee, profile } = useAuth();
  const active = !isEmployee || profile?.isActive !== false;

  const set = useMemo<ReadonlySet<string>>(() => new Set(permissions), [permissions]);

  const can = useCallback(
    (permission: Permission | Permission[]) => {
      if (!active) return false;
      if (role === "admin") return true;
      return Array.isArray(permission)
        ? permission.some((entry) => set.has(entry))
        : set.has(permission);
    },
    [active, role, set]
  );

  return { isAdmin: role === "admin", isEmployee, permissions: set, can };
}
