/**
 * Tipos comunes compartidos entre features
 * Tipos específicos de cada feature van en features/[feature]/domain/models
 */

/**
 * Tipo para datos con ID
 */
export interface WithId<T> {
  id: string;
  data: T;
}

/**
 * Tipo para respuestas de lista paginada
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Tipo para errores de aplicación
 */
export interface AppError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Tipo para resultados de operaciones (Either pattern)
 */
export type Result<T, E = AppError> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Tipo para función que observa cambios (patrón Observer)
 */
export type Observer<T> = (data: T) => void;
