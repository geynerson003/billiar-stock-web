import { useAuth } from "./use-auth";

/**
 * Id del negocio cuyos datos hay que leer/escribir (uid del dueño).
 * Para el admin es su propio uid; para un empleado, el uid de su dueño.
 * `null` mientras el perfil no ha cargado.
 *
 * Sustituye al patrón `const userId = user?.uid` en las páginas de feature.
 */
export function useBusinessId(): string | null {
  return useAuth().businessId;
}
