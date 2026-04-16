/**
 * Firebase Game Tables Repository
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  where,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "../../../../shared/services/firebase/config";
import type { GameTable } from "../../domain/models/game-table.model";
import type { IGameTableRepository } from "../../domain/interfaces/game-table.repository.interface";

export class FirebaseGameTableRepository implements IGameTableRepository {
  private readonly collectionName = "gameTables";

  async getAll(userId: string): Promise<GameTable[]> {
    try {
      const tablesQuery = query(
        collection(db, this.collectionName),
        where("userId", "==", userId)
      );
      const snapshot = await getDocs(tablesQuery);
      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      } as GameTable));
    } catch (error) {
      console.error("Error fetching game tables:", error);
      return [];
    }
  }

  watchAll(userId: string, callback: (tables: GameTable[]) => void): Unsubscribe {
    const tablesQuery = query(
      collection(db, this.collectionName),
      where("userId", "==", userId)
    );

    return onSnapshot(tablesQuery, (snapshot) => {
      const tables = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      } as GameTable));
      callback(tables);
    });
  }

  async getById(userId: string, tableId: string): Promise<GameTable | null> {
    try {
      const docRef = doc(db, this.collectionName, tableId);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        return null;
      }

      const data = snapshot.data();
      if (data.userId !== userId) {
        throw new Error("Unauthorized access");
      }

      return {
        ...data,
        id: snapshot.id,
      } as GameTable;
    } catch (error) {
      console.error("Error fetching game table:", error);
      return null;
    }
  }

  async save(userId: string, table: GameTable): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, table.id);
      await setDoc(docRef, {
        ...table,
        userId,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("Error saving game table:", error);
      throw error;
    }
  }

  async delete(userId: string, tableId: string): Promise<void> {
    try {
      const table = await this.getById(userId, tableId);
      if (!table) {
        throw new Error("Table not found");
      }

      const docRef = doc(db, this.collectionName, tableId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting game table:", error);
      throw error;
    }
  }
}
