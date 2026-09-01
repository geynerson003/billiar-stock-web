/**
 * Config de formato activa. La setea `AuthProvider` a partir del país del perfil
 * (`src/app/store/context/auth.context.tsx`). Antes de que cargue el perfil, o
 * para perfiles antiguos sin país, se usa Colombia / COP como fallback.
 */
let activeLocale = "es-CO";
let activeCurrency = "COP";

export function setActiveFormatConfig(config: { locale: string; currency: string }): void {
  activeLocale = config.locale;
  activeCurrency = config.currency;
}

export function getActiveLocale(): string {
  return activeLocale;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat(activeLocale, {
    style: "currency",
    currency: activeCurrency
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatDate(value?: number | string | null): string {
  if (!value) return "Sin fecha";
  const millis =
    typeof value === "string" ? Number.parseInt(value, 10) : value;

  if (!Number.isFinite(millis)) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat(activeLocale, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(millis));
}

export function formatShortDate(value?: number | string | null): string {
  if (!value) return "Sin fecha";
  const millis =
    typeof value === "string" ? Number.parseInt(value, 10) : value;

  if (!Number.isFinite(millis)) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat(activeLocale, {
    month: "short",
    day: "2-digit"
  }).format(new Date(millis));
}

export function formatPhone(phone: string): string {
  return phone.trim() || "Sin telefono";
}

/** Formatea una duración en milisegundos como mm:ss o hh:mm:ss (nunca negativo). */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}
