/**
 * Game Table Service
 * Orquestación de casos de uso de mesas de juego
 */

import type { GameTable } from "../../domain/models/game-table.model";
import type { IGameTableRepository } from "../../domain/interfaces/game-table.repository.interface";
import { FirebaseGameTableRepository } from "../../infrastructure/repositories/firebase-game-table.repository";

export class GameTableService {
  private repository: IGameTableRepository;

  constructor(repository?: IGameTableRepository) {
    this.repository = repository || new FirebaseGameTableRepository();
  }

  /**
   * Obtiene todas las mesas
   */
  async getAllTables(userId: string): Promise<GameTable[]> {
    try {
      return await this.repository.getAll(userId);
    } catch (error) {
      console.error("Error getting all tables:", error);
      return [];
    }
  }

  /**
   * Observador en tiempo real de mesas
   */
  watchTables(userId: string, callback: (tables: GameTable[]) => void) {
    return this.repository.watchAll(userId, callback);
  }

  /**
   * Obtiene una mesa específica
   */
  async getTableById(userId: string, tableId: string): Promise<GameTable | null> {
    try {
      return await this.repository.getById(userId, tableId);
    } catch (error) {
      console.error("Error getting table:", error);
      return null;
    }
  }

  /**
   * Crea una nueva mesa
   */
  async createTable(
    userId: string,
    tableData: Omit<GameTable, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<GameTable> {
    try {
      const newTable: GameTable = {
        ...tableData,
        id: `table_${Date.now()}`,
        userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await this.repository.save(userId, newTable);
      return newTable;
    } catch (error) {
      console.error("Error creating table:", error);
      throw new Error("No se pudo crear la mesa");
    }
  }

  /**
   * Actualiza el estado de una mesa
   */
  async updateTableStatus(
    userId: string,
    tableId: string,
    status: GameTable["status"]
  ): Promise<void> {
    try {
      const existingTable = await this.repository.getById(userId, tableId);

      if (!existingTable) {
        throw new Error("Mesa no encontrada");
      }

      const updatedTable: GameTable = {
        ...existingTable,
        status,
        updatedAt: Date.now(),
      };

      await this.repository.save(userId, updatedTable);
    } catch (error) {
      console.error("Error updating table status:", error);
      throw error;
    }
  }

  /**
   * Inicia un juego en una mesa
   */
  async startGame(
    userId: string,
    tableId: string,
    players: string[]
  ): Promise<void> {
    try {
      const existingTable = await this.repository.getById(userId, tableId);

      if (!existingTable) {
        throw new Error("Mesa no encontrada");
      }

      const updatedTable: GameTable = {
        ...existingTable,
        status: "playing",
        currentGame: {
          startTime: Date.now(),
          players,
        },
        updatedAt: Date.now(),
      };

      await this.repository.save(userId, updatedTable);
    } catch (error) {
      console.error("Error starting game:", error);
      throw error;
    }
  }

  /**
   * Finaliza un juego
   */
  async finishGame(userId: string, tableId: string): Promise<number> {
    try {
      const existingTable = await this.repository.getById(userId, tableId);

      if (!existingTable) {
        throw new Error("Mesa no encontrada");
      }

      if (!existingTable.currentGame) {
        throw new Error("No hay juego activo en esta mesa");
      }

      // Calcular duración y costo
      const duration = (Date.now() - existingTable.currentGame.startTime) / 3600000; // en horas
      const totalCost = Math.ceil(duration) * existingTable.pricePerHour;

      const updatedTable: GameTable = {
        ...existingTable,
        status: "available",
        currentGame: undefined,
        updatedAt: Date.now(),
      };

      await this.repository.save(userId, updatedTable);
      return totalCost;
    } catch (error) {
      console.error("Error finishing game:", error);
      throw error;
    }
  }

  /**
   * Elimina una mesa
   */
  async deleteTable(userId: string, tableId: string): Promise<void> {
    try {
      await this.repository.delete(userId, tableId);
    } catch (error) {
      console.error("Error deleting table:", error);
      throw new Error("No se pudo eliminar la mesa");
    }
  }

  /**
   * Obtiene mesas disponibles
   */
  async getAvailableTables(userId: string): Promise<GameTable[]> {
    try {
      const allTables = await this.repository.getAll(userId);
      return allTables.filter((table) => table.status === "available");
    } catch (error) {
      console.error("Error getting available tables:", error);
      return [];
    }
  }
}
