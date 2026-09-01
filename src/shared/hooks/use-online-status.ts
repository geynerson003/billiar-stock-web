import { useEffect, useState } from "react";

/**
 * `true` si el navegador cree tener conexión a internet.
 *
 * Ojo: `navigator.onLine` es optimista (da `true` con wifi sin salida). Úsalo
 * como pista, no como verdad absoluta; combínalo con el código de error real de
 * Firestore (`unavailable`) cuando importe.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return online;
}
