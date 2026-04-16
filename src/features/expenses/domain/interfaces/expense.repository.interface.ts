/**
 * Expense Repository Interface
 */

import type { Expense } from "../models/expense.model";

export interface IExpenseRepository {
  /**
   * Obtiene todos los gastos
   */
  getAll(userId: string): Promise<Expense[]>;

  /**
   * Observa cambios en gastos
   */
  watchAll(userId: string, callback: (expenses: Expense[]) => void): () => void;

  /**
   * Obtiene gastos de un período
   */
  getByDateRange(userId: string, startDate: number, endDate: number): Promise<Expense[]>;

  /**
   * Crea o actualiza un gasto
   */
  save(userId: string, expense: Expense): Promise<void>;

  /**
   * Elimina un gasto
   */
  delete(userId: string, expenseId: string): Promise<void>;
}
