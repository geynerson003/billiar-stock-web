import { useEffect, useRef } from "react";
import type { Game } from "../types/models";
import { playTimerAlertSound } from "../utils/audio";
import { useToast } from "../../app/providers/toast.provider";

/**
 * Observa las partidas activas con cronómetro (pricingMode "TIME") y lanza una
 * alerta (sonido + toast) la primera vez que cada una se queda sin tiempo.
 * Se puede montar en varias páginas a la vez (cada una lleva su propio registro
 * de partidas ya alertadas), así el aviso aparece tanto en el listado de mesas
 * como dentro de la sala de la partida.
 */
export function useTableTimerAlerts(games: Game[], getTableName: (tableId: string) => string): void {
  const { toast } = useToast();
  const gamesRef = useRef(games);
  gamesRef.current = games;
  const getTableNameRef = useRef(getTableName);
  getTableNameRef.current = getTableName;
  const alertedGameIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    function check() {
      const now = Date.now();
      const activeIds = new Set<string>();

      gamesRef.current.forEach((game) => {
        if (game.status !== "ACTIVE" || game.pricingMode !== "TIME" || !game.timerDurationMs) return;
        activeIds.add(game.id);
        const expiresAt = game.startTime + game.timerDurationMs;
        if (now < expiresAt) return;

        if (!alertedGameIdsRef.current.has(game.id)) {
          alertedGameIdsRef.current.add(game.id);
          playTimerAlertSound();
          toast("warning", `¡Se acabó el tiempo en ${getTableNameRef.current(game.tableId)}!`);
        }
      });

      // Limpia partidas que ya no están activas (finalizadas o reiniciadas) para no acumular memoria.
      alertedGameIdsRef.current.forEach((id) => {
        if (!activeIds.has(id)) alertedGameIdsRef.current.delete(id);
      });
    }

    check();
    const interval = window.setInterval(check, 1000);
    return () => window.clearInterval(interval);
  }, [toast]);
}
