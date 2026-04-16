import { useState, useCallback, type ReactNode } from "react";
import { Modal } from "./Modal";

interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

/**
 * Hook that provides a modern confirm dialog replacing window.confirm().
 * Returns [ConfirmDialog component, confirm function].
 */
export function useConfirmDialog(): [
  ReactNode,
  (options: ConfirmDialogOptions) => Promise<boolean>
] {
  const [state, setState] = useState<{
    open: boolean;
    options: ConfirmDialogOptions;
    resolve: ((value: boolean) => void) | null;
  }>({
    open: false,
    options: { title: "", message: "" },
    resolve: null,
  });

  const confirm = useCallback(
    (options: ConfirmDialogOptions): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        setState({ open: true, options, resolve });
      });
    },
    []
  );

  function handleClose(result: boolean) {
    state.resolve?.(result);
    setState((prev) => ({ ...prev, open: false, resolve: null }));
  }

  const dialog = (
    <Modal
      open={state.open}
      title=""
      onClose={() => handleClose(false)}
    >
      <div className="confirm-dialog">
        <div className="confirm-dialog__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h4 className="confirm-dialog__title">{state.options.title}</h4>
        <p className="confirm-dialog__message">{state.options.message}</p>
        <div className="confirm-dialog__actions">
          <button
            className="button button--ghost"
            onClick={() => handleClose(false)}
            type="button"
          >
            {state.options.cancelLabel ?? "Cancelar"}
          </button>
          <button
            className="button button--danger"
            onClick={() => handleClose(true)}
            type="button"
          >
            {state.options.confirmLabel ?? "Confirmar"}
          </button>
        </div>
      </div>
    </Modal>
  );

  return [dialog, confirm];
}
