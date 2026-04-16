/**
 * Expense Service
 * Orquestación de casos de uso de gastos
 */

import type { Expense } from "../../domain/models/expense.model";
import type { IExpenseRepository } from "../../domain/interfaces/expense.repository.interface";
import { FirebaseExpenseRepository } from "../../infrastructure/repositories/firebase-expense.repository";

export class ExpenseService {
  private repository: IExpenseRepository;

  constructor(repository?: IExpenseRepository) {
    this.repository = repository || new FirebaseExpenseRepository();
  }

  /**
   * Obtiene todos los gastos
   */
  async getAllExpenses(userId: string): Promise<Expense[]> {
    try {
      return await this.repository.getAll(userId);
    } catch (error) {
      console.error("Error getting all expenses:", error);
      return [];
    }
  }

  /**
   * Observador en tiempo real de gastos
   */
  watchExpenses(userId: string, callback: (expenses: Expense[]) => void) {
    return this.repository.watchAll(userId, callback);
  }

  /**
   * Obtiene gastos de un período específico
   */
  async getExpensesByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Expense[]> {
    try {
      return await this.repository.getByDateRange(
        userId,
        startDate.getTime(),
        endDate.getTime()
      );
    } catch (error) {
      console.error("Error getting expenses by date range:", error);
      return [];
    }
  }

  /**
   * Crea un nuevo gasto
   */
  async createExpense(
    userId: string,
    expenseData: Omit<Expense, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<Expense> {
    try {
      const newExpense: Expense = {
        ...expenseData,
        id: `expense_${Date.now()}`,
        userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await this.repository.save(userId, newExpense);
      return newExpense;
    } catch (error) {
      console.error("Error creating expense:", error);
      throw new Error("No se pudo crear el gasto");
    }
  }

  /**
   * Actualiza un gasto
   */
  async updateExpense(
    userId: string,
    expenseId: string,
    updates: Partial<Expense>
  ): Promise<void> {
    try {
      const allExpenses = await this.repository.getAll(userId);
      const existingExpense = allExpenses.find((e) => e.id === expenseId);

      if (!existingExpense) {
        throw new Error("Gasto no encontrado");
      }

      const updatedExpense: Expense = {
        ...existingExpense,
        ...updates,
        id: expenseId,
        userId,
        updatedAt: Date.now(),
      };

      await this.repository.save(userId, updatedExpense);
    } catch (error) {
      console.error("Error updating expense:", error);
      throw error;
    }
  }

  /**
   * Elimina un gasto
   */
  async deleteExpense(userId: string, expenseId: string): Promise<void> {
    try {
      await this.repository.delete(userId, expenseId);
    } catch (error) {
      console.error("Error deleting expense:", error);
      throw new Error("No se pudo eliminar el gasto");
    }
  }

  /**
   * Calcula gastos totales por categoría
   */
  async getTotalsByCategory(userId: string): Promise<Record<string, number>> {
    try {
      const expenses = await this.repository.getAll(userId);
      const totals: Record<string, number> = {};

      expenses.forEach((expense) => {
        totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
      });

      return totals;
    } catch (error) {
      console.error("Error calculating totals by category:", error);
      return {};
    }
  }

  /**
   * Calcula gastos totales de un período
   */
  async getTotalByPeriod(userId: string, startDate: Date, endDate: Date): Promise<number> {
    try {
      const expenses = await this.repository.getByDateRange(
        userId,
        startDate.getTime(),
        endDate.getTime()
      );
      return expenses.reduce((total, expense) => total + expense.amount, 0);
    } catch (error) {
      console.error("Error calculating period total:", error);
      return 0;
    }
  }
}
