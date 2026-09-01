import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from "react";

/* ── Types ── */
type ToastType = "success" | "error" | "info" | "warning";

interface ToastOptions {
  /** Milisegundos antes del auto-cierre. Por defecto depende del tipo. */
  duration?: number;
  /** Si muestra botón de cerrar. Por defecto `true`. */
  dismissible?: boolean;
}

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  dismissible: boolean;
  exiting?: boolean;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

/* ── Duración por tipo (los errores necesitan más tiempo de lectura) ── */
const DEFAULT_DURATION: Record<ToastType, number> = {
  error: 6000,
  warning: 5000,
  success: 3500,
  info: 3500,
};

/* ── SVG Icons for toast types ── */
const toastIcons: Record<ToastType, ReactNode> = {
  success: (
    <svg className="toast__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  error: (
    <svg className="toast__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  info: (
    <svg className="toast__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  warning: (
    <svg className="toast__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

const closeIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

let nextId = 0;

/* ── Provider ── */
export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const toast = useCallback(
    (type: ToastType, message: string, options?: ToastOptions) => {
      const id = ++nextId;
      const dismissible = options?.dismissible ?? true;
      setToasts((prev) => [...prev, { id, type, message, dismissible }]);

      const duration = options?.duration ?? DEFAULT_DURATION[type];
      const timer = setTimeout(() => {
        timers.current.delete(id);
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 300);
      }, duration);
      timers.current.set(id, timer);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => {
          const assertive = t.type === "error" || t.type === "warning";
          return (
            <div
              className={`toast toast--${t.type} ${t.exiting ? "toast--exiting" : ""}`}
              key={t.id}
              role={assertive ? "alert" : "status"}
              aria-live={assertive ? "assertive" : "polite"}
            >
              {toastIcons[t.type]}
              <span>{t.message}</span>
              {t.dismissible && (
                <button
                  className="toast__close"
                  type="button"
                  aria-label="Cerrar"
                  onClick={() => dismiss(t.id)}
                >
                  {closeIcon}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
