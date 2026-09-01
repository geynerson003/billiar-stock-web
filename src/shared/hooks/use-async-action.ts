import { useCallback, useState } from "react";
import { useToast } from "../../app/providers/toast.provider";
import { reportError } from "../utils/report-error";
import {
  feedbackText,
  getErrorMessage,
  isKnownFeedback,
  type FeedbackId,
} from "../feedback";

interface AsyncActionOptions {
  /** Texto o `FeedbackId` a mostrar como toast de éxito. Si se omite, no hay toast de éxito. */
  success?: string;
  /** `FeedbackId` del catálogo usado como mensaje de error si no se puede traducir. */
  errorFallbackId?: FeedbackId;
  /** Texto de error explícito (gana sobre `errorFallbackId`). */
  errorFallback?: string;
  /** Se ejecuta solo si la operación terminó sin lanzar. */
  onSuccess?: () => void;
}

function resolveText(value: string): string {
  return isKnownFeedback(value) ? feedbackText(value) : value;
}

/**
 * Envuelve una mutación async con `try/catch`, toast de error traducido,
 * `reportError` y un flag `pending` para deshabilitar botones.
 *
 *   const { run, pending } = useAsyncAction();
 *   await run(() => addSale(userId, sale), {
 *     success: "sales.save.success",
 *     errorFallbackId: "sales.save.error",
 *     onSuccess: closeModal,
 *   });
 */
export function useAsyncAction() {
  const { toast } = useToast();
  const [pending, setPending] = useState(false);

  const run = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      opts: AsyncActionOptions = {}
    ): Promise<T | undefined> => {
      setPending(true);
      try {
        const result = await fn();
        if (opts.success) toast("success", resolveText(opts.success));
        opts.onSuccess?.();
        return result;
      } catch (error) {
        reportError(error);
        toast(
          "error",
          getErrorMessage(error, {
            fallbackId: opts.errorFallbackId,
            fallback: opts.errorFallback,
          })
        );
        return undefined;
      } finally {
        setPending(false);
      }
    },
    [toast]
  );

  return { run, pending };
}
