/**
 * Barrel del módulo de feedback: catálogo de mensajes de negocio, catálogo de
 * variantes de la pantalla de error y resolutor genérico de errores.
 *
 * Se importa como `../../shared/feedback` (no se añade a los barrels de
 * `constants/` ni `utils/` para evitar ciclos de importación).
 */

export * from "./feedback-messages";
export * from "./error-variants";
export * from "./get-error-message";
