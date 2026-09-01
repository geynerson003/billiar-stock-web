/**
 * Catálogo de variantes de la pantalla de error (`ErrorPage`).
 *
 * Patrón idéntico al de `src/shared/constants/markets.ts`: tipo unión de IDs +
 * catálogo tipado (fuente de verdad) + índice `Map` + resolutor con fallback +
 * type guard.
 *
 * El componente `src/components/common/ErrorPage.tsx` consume este catálogo para
 * derivar título, mensaje, icono y acción por defecto de cada variante. El caller
 * puede sobreescribir `title` / `message` por props.
 */

export type ErrorVariant =
  | "not-found"
  | "forbidden"
  | "crash"
  | "offline"
  | "update-required";

/** Acción del botón primario de la pantalla de error. */
export type ErrorPrimaryAction = "home" | "reload" | "retry" | "back";

/** Nombre del icono (mapeado a un SVG inline dentro de `ErrorPage`). */
export type ErrorIconName =
  | "search"
  | "lock"
  | "alert-triangle"
  | "wifi-off"
  | "download";

export interface ErrorVariantCopy {
  /** Identificador de la variante. */
  id: ErrorVariant;
  /** Código mostrado como eyebrow (p. ej. "404"). `null` si no aplica. */
  code: string | null;
  /** Título principal. */
  title: string;
  /** Mensaje explicativo por defecto. */
  message: string;
  /** Texto del botón primario. */
  primaryCta: string;
  /** Qué hace el botón primario. */
  primaryAction: ErrorPrimaryAction;
  /** Si se muestra el botón "Cerrar sesión" (requiere `onLogout`). */
  showLogout: boolean;
  /** Icono de la variante. */
  icon: ErrorIconName;
}

/** Fuente de verdad. */
export const ERROR_VARIANTS: ErrorVariantCopy[] = [
  {
    id: "not-found",
    code: "404",
    title: "Página no encontrada",
    message: "La sección que buscas no existe o cambió de lugar.",
    primaryCta: "Volver al inicio",
    primaryAction: "home",
    showLogout: false,
    icon: "search",
  },
  {
    id: "forbidden",
    code: "403",
    title: "Sin acceso",
    message:
      "No tienes permisos para ver esta sección. Contacta al administrador de tu negocio.",
    primaryCta: "Volver al inicio",
    primaryAction: "home",
    showLogout: true,
    icon: "lock",
  },
  {
    id: "crash",
    code: null,
    title: "Algo salió mal",
    message:
      "Ocurrió un error inesperado. Puedes recargar la página para continuar.",
    primaryCta: "Recargar",
    primaryAction: "reload",
    showLogout: false,
    icon: "alert-triangle",
  },
  {
    id: "offline",
    code: null,
    title: "Sin conexión",
    message:
      "Revisa tu conexión a internet. Los cambios se sincronizarán cuando vuelvas a estar en línea.",
    primaryCta: "Reintentar",
    primaryAction: "retry",
    showLogout: false,
    icon: "wifi-off",
  },
  {
    id: "update-required",
    code: null,
    title: "Nueva versión disponible",
    message: "Se publicó una actualización. Recarga para obtener la última versión.",
    primaryCta: "Recargar",
    primaryAction: "reload",
    showLogout: false,
    icon: "download",
  },
];

/** Variante usada como fallback. */
export const DEFAULT_ERROR_VARIANT: ErrorVariant = "crash";

/** Índice para lookup O(1). */
const ERROR_VARIANT_BY_ID = new Map<ErrorVariant, ErrorVariantCopy>(
  ERROR_VARIANTS.map((variant) => [variant.id, variant])
);

/**
 * Resuelve el copy de una variante de error. Nunca devuelve `undefined`:
 * si el ID no existe, cae en `DEFAULT_ERROR_VARIANT` ("crash").
 */
export function getErrorVariant(id?: string | null): ErrorVariantCopy {
  return (
    (id ? ERROR_VARIANT_BY_ID.get(id as ErrorVariant) : undefined) ??
    ERROR_VARIANT_BY_ID.get(DEFAULT_ERROR_VARIANT)!
  );
}

/** Type guard: `true` si el ID pertenece al catálogo. */
export function isKnownErrorVariant(id?: string | null): id is ErrorVariant {
  return !!id && ERROR_VARIANT_BY_ID.has(id as ErrorVariant);
}
