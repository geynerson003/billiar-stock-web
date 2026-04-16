/**
 * Re-export de useAuth desde features/auth
 * Mantiene compatibilidad con código existente que importa desde shared/hooks
 */

export { useAuth } from "../../features/auth/presentation/hooks";
export type { AuthContextValue } from "../../app/store/context";
