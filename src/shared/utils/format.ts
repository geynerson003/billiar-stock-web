export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatDate(value?: number | string | null): string {
  if (!value) return "Sin fecha";
  const millis =
    typeof value === "string" ? Number.parseInt(value, 10) : value;

  if (!Number.isFinite(millis)) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-CO", {
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

  return new Intl.DateTimeFormat("es-CO", {
    month: "short",
    day: "2-digit"
  }).format(new Date(millis));
}

export function formatPhone(phone: string): string {
  return phone.trim() || "Sin telefono";
}
