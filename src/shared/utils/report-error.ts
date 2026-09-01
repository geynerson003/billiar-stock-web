/**
 * Punto único de registro de errores no controlados. Hoy solo hace
 * `console.error`; es el sitio donde enganchar Sentry u otro servicio a futuro.
 */

export function reportError(error: unknown, context?: unknown): void {
  // TODO: enviar a Sentry / servicio de monitoreo cuando exista.
  if (context !== undefined) {
    console.error("[app-error]", error, context);
  } else {
    console.error("[app-error]", error);
  }
}

/**
 * `true` si el error es un fallo al cargar un chunk / módulo dinámico, típico
 * tras un deploy nuevo (el `index.html` sirve hashes de assets que ya no existen).
 */
export function isChunkLoadError(error: unknown): boolean {
  if (error && typeof error === "object") {
    const name = (error as { name?: unknown }).name;
    if (name === "ChunkLoadError") return true;
  }
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /failed to fetch dynamically imported module|importing a module script failed|error loading dynamically imported module/i.test(
    message
  );
}
