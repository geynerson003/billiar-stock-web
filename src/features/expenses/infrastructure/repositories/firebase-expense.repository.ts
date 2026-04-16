/**
 * Firebase Expense Repository
 */

import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  where,
  onSnapshot,
  Unsubscribe,
  orderBy,
} from "firebase/firestore";
import { db } from "../../../../shared/services/firebase/config";
import type { Expense } from "../../domain/models/expense.model";
import type { IExpenseRepository } from "../../domain/interfaces/expense.repository.interface";

export class FirebaseExpenseRepository implements IExpenseRepository {
  private readonly collectionName = "expenses";

  async getAll(userId: string): Promise<Expense[]> {
    try {
      const expensesQuery = query(
        collection(db, this.collectionName),
        where("userId", "==", userId),
        orderBy("date", "desc")
      );
      const snapshot = await getDocs(expensesQuery);
      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      } as Expense));
    } catch (error) {
      console.error("Error fetching expenses:", error);
      return [];
    }
  }

  watchAll(userId: string, callback: (expenses: Expense[]) => void): Unsubscribe {
    const expensesQuery = query(
      collection(db, this.collectionName),
      where("userId", "==", userId),
      orderBy("date", "desc")
    );

    return onSnapshot(expensesQuery, (snapshot) => {
      const expenses = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      } as Expense));
      callback(expenses);
    });
  }

  async getByDateRange(
    userId: string,
    startDate: number,
    endDate: number
  ): Promise<Expense[]> {
    try {
      const expensesQuery = query(
        collection(db, this.collectionName),
        where("userId", "==", userId),
        where("date", ">=", startDate),
        where("date", "<=", endDate),
        orderBy("date", "desc")
      );
      const snapshot = await getDocs(expensesQuery);
      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      } as Expense));
    } catch (error) {
      console.error("Error fetching expenses by date range:", error);
      return [];
    }
  }

  async save(userId: string, expense: Expense): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, expense.id);
      await setDoc(docRef, {
        ...expense,
        userId,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("Error saving expense:", error);
      throw error;
    }
  }

  async delete(userId: string, expenseId: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, expenseId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting expense:", error);
      throw error;
    }
  }
}
