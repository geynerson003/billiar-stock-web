import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { IScannerControls } from "@zxing/browser";
import { Modal } from "./Modal";
import { useToast } from "../../shared/hooks";
import { SCANNER_MODES, getScannerModeOption, type ScannerModeId } from "../../shared/constants/scanner";

interface BarcodeScanModalProps {
  open: boolean;
  onClose: () => void;
  onDetect: (code: string) => void;
  /** Modo con el que abre el modal (normalmente la preferencia de `useScannerMode`). */
  initialMode: ScannerModeId;
  /** Cierra el modal automáticamente tras la primera detección. Default: true. */
  closeOnDetect?: boolean;
  title?: string;
}

function describeCameraError(error: unknown): string {
  const name = error instanceof Error ? error.name : "";
  switch (name) {
    case "NotAllowedError":
      return "Permiso de cámara denegado. Permite el acceso a la cámara o usa un lector físico.";
    case "NotFoundError":
      return "No se encontró ninguna cámara en este dispositivo.";
    case "NotReadableError":
      return "La cámara está siendo usada por otra aplicación.";
    default:
      if (
        typeof window !== "undefined" &&
        window.location.protocol !== "https:" &&
        window.location.hostname !== "localhost"
      ) {
        return "La cámara requiere una conexión segura (HTTPS) para funcionar.";
      }
      return "No se pudo acceder a la cámara.";
  }
}

export function BarcodeScanModal({
  open,
  onClose,
  onDetect,
  initialMode,
  closeOnDetect = true,
  title = "Escanear código de barras",
}: BarcodeScanModalProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<ScannerModeId>(initialMode);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hidValue, setHidValue] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hidInputRef = useRef<HTMLInputElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  /* Al reabrir el modal, vuelve al modo configurado por defecto. */
  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  useEffect(() => {
    if (!open) {
      setHidValue("");
      setCameraError(null);
    }
  }, [open]);

  /* Ciclo de vida de la cámara: se inicia solo en modo "camera" y se libera
     siempre en el cleanup (evita dejar la cámara encendida). */
  useEffect(() => {
    if (!open || mode !== "camera") return;

    let cancelled = false;
    setCameraError(null);

    async function startCamera() {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current ?? undefined,
          (result) => {
            if (result && !cancelled) {
              onDetect(result.getText());
              if (closeOnDetect) onClose();
            }
          }
        );

        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
      } catch (error) {
        if (!cancelled) setCameraError(describeCameraError(error));
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [open, mode, closeOnDetect, onClose, onDetect]);

  useEffect(() => {
    if (open && mode === "hid") {
      hidInputRef.current?.focus();
    }
  }, [open, mode]);

  function handleHidKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const code = hidValue.trim();
    setHidValue("");
    if (!code) return;
    onDetect(code);
    if (closeOnDetect) onClose();
  }

  function handleCameraFallback() {
    setMode("hid");
    toast("info", "Cambiado a modo lector físico.");
  }

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div className="inline-actions" role="tablist">
          {SCANNER_MODES.map((option) => (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={mode === option.id}
              className={`button ${mode === option.id ? "button--primary" : "button--secondary"}`}
              onClick={() => setMode(option.id)}
            >
              {option.name}
            </button>
          ))}
        </div>

        {mode === "camera" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <video
              ref={videoRef}
              muted
              playsInline
              style={{ width: "100%", borderRadius: "var(--radius-sm, 8px)", background: "#000" }}
            />
            {cameraError && (
              <div className="empty-state">
                <p>{cameraError}</p>
                <button className="button button--secondary" type="button" onClick={handleCameraFallback}>
                  Usar lector físico
                </button>
              </div>
            )}
          </div>
        )}

        {mode === "hid" && (
          <label className="field">
            <span>Escanea con tu lector físico</span>
            <input
              ref={hidInputRef}
              autoFocus
              value={hidValue}
              onChange={(event) => setHidValue(event.target.value)}
              onKeyDown={handleHidKeyDown}
              placeholder="Apunta el lector y escanea…"
            />
            <span className="field__hint" style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
              {getScannerModeOption("hid").description}
            </span>
          </label>
        )}
      </div>
    </Modal>
  );
}
