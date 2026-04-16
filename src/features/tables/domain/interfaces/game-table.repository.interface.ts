/**
 * Game Table Repository Interface
 */

import type { GameTable, GameSession } from "../models/game-table.model";

export interface IGameTableRepository {
  /**
   * Obtiene todas las mesas
   */
  getAll(userId: string): Promise<GameTable[]>;

  /**
   * Observa cambios en todas las mesas
   */
  watchAll(userId: string, callback: (tables: GameTable[]) => void): () => void;

  /**
   * Obtiene una mesa específica
   */
  getById(userId: string, tableId: string): Promise<GameTable | null>;

  /**
   * Crea o actualiza una mesa
   */
  save(userId: string, table: GameTable): Promise<void>;

  /**
   * Elimina una mesa
   */
  delete(userId: string, tableId: string): Promise<void>;
}

export interface IGameSessionRepository {
  /**
   * Obtiene todas las sesiones de una mesa
   */
  getSessions(userId: string, tableId: string): Promise<GameSession[]>;

  /**
   * Crea una nueva sesión de juego
   */
  createSession(userId: string, session: GameSession): Promise<void>;

  /**
   * Actualiza una sesión
   */
  updateSession(userId: string, sessionId: string, updates: Partial<GameSession>): Promise<void>;

  /**
   * Obtiene sesiones pendientes de pago
   */
  getPendingSessions(userId: string): Promise<GameSession[]>;
}
