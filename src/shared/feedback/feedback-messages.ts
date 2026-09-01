/**
 * Catálogo de mensajes de feedback (éxito / error / validación) de la plataforma.
 *
 * Patrón idéntico al de `src/shared/constants/markets.ts`: tipo unión de IDs +
 * catálogo tipado (fuente de verdad) + índice `Map` + resolutor con fallback
 * (nunca devuelve `undefined`) + type guard.
 *
 * Convención de IDs: `dominio.accion.resultado` (p. ej. `sales.save.success`).
 * Los textos están en español, con tuteo y el tono del resto de la app
 * ("…con éxito", "No se pudo…", "Verifica…").
 *
 * Uso típico:
 *   toast("success", feedbackText("sales.save.success"))
 *   toast("error", getErrorMessage(err, { fallbackId: "sales.save.error" }))
 */

export type FeedbackId =
  // Ventas
  | "sales.save.success"
  | "sales.save.error"
  | "sales.delete.success"
  | "sales.delete.error"
  | "sales.payment.success"
  | "sales.payment.error"
  // Inventario
  | "inventory.save.success"
  | "inventory.save.error"
  | "inventory.delete.success"
  | "inventory.delete.error"
  // Clientes
  | "clients.save.success"
  | "clients.save.error"
  | "clients.delete.success"
  | "clients.delete.error"
  // Deudas
  | "debt.pay.success"
  | "debt.pay.error"
  | "debt.markPaid.success"
  | "debt.markPaid.error"
  // Gastos
  | "expenses.save.success"
  | "expenses.save.error"
  | "expenses.delete.success"
  | "expenses.delete.error"
  // Mesas y sesiones
  | "tables.save.success"
  | "tables.save.error"
  | "tables.delete.success"
  | "tables.delete.error"
  | "tables.session.start.success"
  | "tables.session.start.error"
  | "tables.session.finish.success"
  | "tables.session.finish.error"
  // Juegos / partidas
  | "games.create.success"
  | "games.create.error"
  | "games.update.success"
  | "games.update.error"
  // Empleados y ajustes
  | "employees.save.success"
  | "employees.save.error"
  | "settings.save.success"
  | "settings.save.error"
  // Validaciones frecuentes
  | "validation.requiredFields"
  | "validation.emptyCart"
  | "validation.selectTable"
  | "validation.quantityPositive"
  | "validation.amountPositive"
  | "validation.basketPriceMissing"
  | "validation.productNotFound"
  | "validation.paymentOverDebt"
  // Genéricos
  | "generic.saveError"
  | "generic.deleteError"
  | "generic.loadError"
  | "generic.offline"
  | "generic.retry";

export type FeedbackTone = "success" | "error" | "info" | "warning";

export interface FeedbackMessage {
  /** Identificador estable del mensaje. */
  id: FeedbackId;
  /** Texto en español mostrado al usuario. */
  text: string;
  /** Tono sugerido para el toast / alerta. */
  tone: FeedbackTone;
}

/** Fuente de verdad. */
export const FEEDBACK_MESSAGES: FeedbackMessage[] = [
  // Ventas
  { id: "sales.save.success", text: "Venta registrada con éxito.", tone: "success" },
  { id: "sales.save.error", text: "No se pudo registrar la venta. Intenta de nuevo.", tone: "error" },
  { id: "sales.delete.success", text: "Venta eliminada.", tone: "success" },
  { id: "sales.delete.error", text: "No se pudo eliminar la venta. Intenta de nuevo.", tone: "error" },
  { id: "sales.payment.success", text: "Pago registrado.", tone: "success" },
  { id: "sales.payment.error", text: "No se pudo registrar el pago. Intenta de nuevo.", tone: "error" },

  // Inventario
  { id: "inventory.save.success", text: "Producto guardado con éxito.", tone: "success" },
  { id: "inventory.save.error", text: "No se pudo guardar el producto. Intenta de nuevo.", tone: "error" },
  { id: "inventory.delete.success", text: "Producto eliminado.", tone: "success" },
  { id: "inventory.delete.error", text: "No se pudo eliminar el producto. Intenta de nuevo.", tone: "error" },

  // Clientes
  { id: "clients.save.success", text: "Cliente guardado con éxito.", tone: "success" },
  { id: "clients.save.error", text: "No se pudo guardar el cliente. Intenta de nuevo.", tone: "error" },
  { id: "clients.delete.success", text: "Cliente eliminado.", tone: "success" },
  { id: "clients.delete.error", text: "No se pudo eliminar el cliente. Intenta de nuevo.", tone: "error" },

  // Deudas
  { id: "debt.pay.success", text: "Abono registrado.", tone: "success" },
  { id: "debt.pay.error", text: "No se pudo registrar el abono. Intenta de nuevo.", tone: "error" },
  { id: "debt.markPaid.success", text: "Deuda marcada como pagada.", tone: "success" },
  { id: "debt.markPaid.error", text: "No se pudo actualizar la deuda. Intenta de nuevo.", tone: "error" },

  // Gastos
  { id: "expenses.save.success", text: "Gasto guardado con éxito.", tone: "success" },
  { id: "expenses.save.error", text: "No se pudo guardar el gasto. Intenta de nuevo.", tone: "error" },
  { id: "expenses.delete.success", text: "Gasto eliminado.", tone: "success" },
  { id: "expenses.delete.error", text: "No se pudo eliminar el gasto. Intenta de nuevo.", tone: "error" },

  // Mesas y sesiones
  { id: "tables.save.success", text: "Mesa guardada con éxito.", tone: "success" },
  { id: "tables.save.error", text: "No se pudo guardar la mesa. Intenta de nuevo.", tone: "error" },
  { id: "tables.delete.success", text: "Mesa eliminada.", tone: "success" },
  { id: "tables.delete.error", text: "No se pudo eliminar la mesa. Intenta de nuevo.", tone: "error" },
  { id: "tables.session.start.success", text: "Sesión iniciada.", tone: "success" },
  { id: "tables.session.start.error", text: "No se pudo iniciar la sesión. Intenta de nuevo.", tone: "error" },
  { id: "tables.session.finish.success", text: "Sesión cerrada.", tone: "success" },
  { id: "tables.session.finish.error", text: "No se pudo cerrar la sesión. Intenta de nuevo.", tone: "error" },

  // Juegos / partidas
  { id: "games.create.success", text: "Partida creada.", tone: "success" },
  { id: "games.create.error", text: "No se pudo crear la partida. Intenta de nuevo.", tone: "error" },
  { id: "games.update.success", text: "Partida actualizada.", tone: "success" },
  { id: "games.update.error", text: "No se pudo actualizar la partida. Intenta de nuevo.", tone: "error" },

  // Empleados y ajustes
  { id: "employees.save.success", text: "Cambios guardados con éxito.", tone: "success" },
  { id: "employees.save.error", text: "No se pudieron guardar los cambios. Intenta de nuevo.", tone: "error" },
  { id: "settings.save.success", text: "Ajustes guardados con éxito.", tone: "success" },
  { id: "settings.save.error", text: "No fue posible guardar los cambios. Intenta de nuevo.", tone: "error" },

  // Validaciones frecuentes
  { id: "validation.requiredFields", text: "Por favor completa todos los campos obligatorios.", tone: "warning" },
  { id: "validation.emptyCart", text: "Agrega al menos un ítem antes de continuar.", tone: "warning" },
  { id: "validation.selectTable", text: "Selecciona una mesa para continuar.", tone: "warning" },
  { id: "validation.quantityPositive", text: "La cantidad debe ser un número mayor que cero.", tone: "warning" },
  { id: "validation.amountPositive", text: "El monto debe ser un número mayor que cero.", tone: "warning" },
  { id: "validation.basketPriceMissing", text: "El producto no tiene precio por canasta configurado.", tone: "warning" },
  { id: "validation.productNotFound", text: "No se encontró ningún producto con ese código.", tone: "warning" },
  { id: "validation.paymentOverDebt", text: "El monto supera la deuda pendiente del cliente.", tone: "warning" },

  // Genéricos
  { id: "generic.saveError", text: "No se pudo guardar. Intenta de nuevo.", tone: "error" },
  { id: "generic.deleteError", text: "No se pudo eliminar. Intenta de nuevo.", tone: "error" },
  { id: "generic.loadError", text: "No se pudo cargar la información. Intenta de nuevo.", tone: "error" },
  { id: "generic.offline", text: "Sin conexión a internet. Revisa tu red e intenta de nuevo.", tone: "warning" },
  { id: "generic.retry", text: "Ocurrió un error. Intenta de nuevo.", tone: "error" },
];

/** ID usado como fallback cuando no se encuentra un mensaje. */
export const DEFAULT_FEEDBACK_ID: FeedbackId = "generic.saveError";

/** Índice para lookup O(1). */
const FEEDBACK_BY_ID = new Map<FeedbackId, FeedbackMessage>(
  FEEDBACK_MESSAGES.map((message) => [message.id, message])
);

/**
 * Resuelve un mensaje de feedback por su ID. Nunca devuelve `undefined`:
 * si el ID no existe, cae en `DEFAULT_FEEDBACK_ID`.
 */
export function getFeedbackMessage(id?: string | null): FeedbackMessage {
  return (
    (id ? FEEDBACK_BY_ID.get(id as FeedbackId) : undefined) ??
    FEEDBACK_BY_ID.get(DEFAULT_FEEDBACK_ID)!
  );
}

/** Type guard: `true` si el ID pertenece al catálogo. */
export function isKnownFeedback(id?: string | null): id is FeedbackId {
  return !!id && FEEDBACK_BY_ID.has(id as FeedbackId);
}

/** Azúcar: devuelve solo el texto de un mensaje del catálogo. */
export function feedbackText(id: FeedbackId): string {
  return getFeedbackMessage(id).text;
}
