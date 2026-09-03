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

/** Evita re-emitir el mismo código varias veces por segundo en modo continuo. */
const SAME_CODE_COOLDOWN_MS = 1500;

type ScanStatus = "searching" | "found";

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
  const [scanStatus, setScanStatus] = useState<ScanStatus>("searching");
  const [hidValue, setHidValue] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hidInputRef = useRef<HTMLInputElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const lastDetectionRef = useRef<{ code: string; at: number } | null>(null);

  /* Al reabrir el modal, vuelve al modo configurado por defecto. */
  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  useEffect(() => {
    if (!open) {
      setHidValue("");
      setCameraError(null);
      setScanStatus("searching");
      lastDetectionRef.current = null;
    }
  }, [open]);

  /* Ciclo de vida de la cámara: se inicia solo en modo "camera" y se libera
     siempre en el cleanup (evita dejar la cámara encendida). */
  useEffect(() => {
    if (!open || mode !== "camera") return;

    let cancelled = false;
    let resetTimer: ReturnType<typeof setTimeout> | null = null;
    setCameraError(null);
    setScanStatus("searching");

    function handleDetection(rawCode: string) {
      const code = rawCode.trim();
      if (!code) return;

      const now = Date.now();
      const last = lastDetectionRef.current;
      if (last && last.code === code && now - last.at < SAME_CODE_COOLDOWN_MS) return;
      lastDetectionRef.current = { code, at: now };

      setScanStatus("found");
      onDetect(code);

      if (closeOnDetect) {
        onClose();
        return;
      }

      /* Modo continuo: vuelve a "buscando" tras el destello verde. */
      if (resetTimer) clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        if (!cancelled) setScanStatus("searching");
      }, 900);
    }

    async function startCamera() {
      try {
        const [{ BrowserMultiFormatReader }, { DecodeHintType, BarcodeFormat }] = await Promise.all([
          import("@zxing/browser"),
          import("@zxing/library"),
        ]);

        /* Restringir formatos a códigos de producto acelera bastante la
           decodificación (ZXing deja de probar simbologías irrelevantes). */
        const hints = new Map<number, unknown>();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.ITF,
          BarcodeFormat.CODABAR,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);

        const reader = new BrowserMultiFormatReader(hints, {
          delayBetweenScanAttempts: 100,
          delayBetweenScanSuccess: SAME_CODE_COOLDOWN_MS,
        });

        const controls = await reader.decodeFromConstraints(
          {
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          videoRef.current ?? undefined,
          (result) => {
            if (result && !cancelled) handleDetection(result.getText());
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
      if (resetTimer) clearTimeout(resetTimer);
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

  const found = scanStatus === "found";
  const feedbackColor = found ? "var(--green)" : "var(--red)";

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

        {mode === "camera" &&
          (cameraError ? (
            <div className="empty-state">
              <p>{cameraError}</p>
              <button className="button button--secondary" type="button" onClick={handleCameraFallback}>
                Usar lector físico
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "center" }}>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  maxWidth: "320px",
                  aspectRatio: "5 / 2",
                  overflow: "hidden",
                  borderRadius: "var(--radius-sm, 8px)",
                  background: "#000",
                  border: `3px solid ${feedbackColor}`,
                  boxShadow: found ? "0 0 0 4px rgba(31, 111, 74, 0.3)" : "none",
                  transition: "border-color 150ms ease, box-shadow 150ms ease",
                }}
              >
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: "8%",
                    right: "8%",
                    top: "50%",
                    height: "2px",
                    transform: "translateY(-50%)",
                    background: feedbackColor,
                    opacity: 0.9,
                    transition: "background 150ms ease",
                  }}
                />
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: feedbackColor,
                  transition: "color 150ms ease",
                }}
              >
                {found ? "✓ Código detectado" : "Buscando código…"}
              </p>
            </div>
          ))}

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
