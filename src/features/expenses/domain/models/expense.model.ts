/**
 * Expense Model
 * Modelo de dominio para Gastos
 */

export interface Expense {
  id: string;
  userId: string;
  description: string;
  amount: number;
  category: "operations" | "supplies" | "maintenance" | "utilities" | "other";
  date: number;
  paymentMethod: "cash" | "card" | "check" | "transfer";
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export const defaultExpense: Expense = {
  id: "",
  userId: "",
  description: "",
  amount: 0,
  category: "other",
  date: Date.now(),
  paymentMethod: "cash",
  createdAt: Date.now(),
  updatedAt: Date.now(),
};
