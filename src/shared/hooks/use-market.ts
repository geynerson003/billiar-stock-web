/**
 * Hook de mercado. Resuelve la configuración del tipo de negocio del usuario
 * (terminología + secciones visibles) a partir de `profile.market`.
 * Se deriva de `useAuth()`, no necesita un contexto propio.
 */

import { useMemo } from "react";
import { getMarketOption, type MarketOption } from "../constants";
import { useAuth } from "./use-auth";

export function useMarket(): MarketOption {
  const { profile } = useAuth();
  return useMemo(() => getMarketOption(profile?.market), [profile?.market]);
}
