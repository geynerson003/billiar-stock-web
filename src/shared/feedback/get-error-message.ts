/**
 * Resolutor genérico de errores → mensaje en español para el usuario.
 *
 * Orden de resolución:
 *   1. Error con `messageKey` conocido (gancho para un futuro `AppError` de dominio).
 *   2. Sin conexión + error que parece de red → mensaje offline.
 *   3. Delega en `getFirebaseErrorMessage` (códigos `auth/*` y Firestore).
 *   4. Fallback: `opts.fallback` → `opts.fallbackId` → `"generic.saveError"`.
 */

import { getFirebaseErrorMessage } from "../utils/firebase-errors";
import { feedbackText, isKnownFeedback, type FeedbackId } from "./feedback-messages";

export interface ResolveErrorOptions {
  /** ID del catálogo usado como fallback si no se puede traducir el error. */
  fallbackId?: FeedbackId;
  /** Texto de fallback explícito (gana sobre `fallbackId`). */
  fallback?: string;
}

/** Extrae un `messageKey` de feedback si el error lo lleva (duck typing). */
function extractMessageKey(error: unknown): FeedbackId | null {
  if (
    error &&
    typeof error === "object" &&
    "messageKey" in error &&
    typeof (error as { messageKey: unknown }).messageKey === "string"
  ) {
    const key = (error as { messageKey: string }).messageKey;
    return isKnownFeedback(key) ? key : null;
  }
  return null;
}

/** Heurística: ¿el error parece un fallo de red / servicio no disponible? */
function looksLikeNetworkError(error: unknown): boolean {
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  if (code === "unavailable" || code === "auth/network-request-failed") return true;

  const message = error instanceof Error ? error.message : String(error ?? "");
  return /failed to fetch|network error|networkerror|net::err/i.test(message);
}

export function getErrorMessage(
  error: unknown,
  opts: ResolveErrorOptions = {}
): string {
  const messageKey = extractMessageKey(error);
  if (messageKey) return feedbackText(messageKey);

  const fallback =
    opts.fallback ?? feedbackText(opts.fallbackId ?? "generic.saveError");

  if (typeof navigator !== "undefined" && !navigator.onLine && looksLikeNetworkError(error)) {
    return feedbackText("generic.offline");
  }

  return getFirebaseErrorMessage(error, fallback);
}
