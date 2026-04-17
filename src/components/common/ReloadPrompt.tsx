/// <reference types="vite-plugin-pwa/client" />
import { useRegisterSW } from "virtual:pwa-register/react";

export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error("SW registration error", error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="reload-prompt" role="alert">
      <div className="reload-prompt__message">
        {offlineReady ? (
          <span>Aplicación lista para funcionar sin conexión.</span>
        ) : (
          <span>Nueva versión disponible, por favor actualiza para aplicar los cambios.</span>
        )}
      </div>
      
      <div className="reload-prompt__actions">
        {needRefresh && (
          <button className="button button--primary" onClick={() => void updateServiceWorker(true)} type="button">
            Actualizar
          </button>
        )}
        <button className="button button--secondary" onClick={close} type="button">
          Cerrar
        </button>
      </div>
    </div>
  );
}
