/**
 * Firebase Client Repository
 * Implementación de persistencia de clientes en Firestore
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
import type { Client } from "../../domain/models/client.model";
import type { IClientRepository } from "../../domain/interfaces/client.repository.interface";

export class FirebaseClientRepository implements IClientRepository {
  private readonly collectionName = "clients";

  async getAll(userId: string): Promise<Client[]> {
    try {
      const clientsQuery = query(
        collection(db, this.collectionName),
        where("userId", "==", userId)
      );
      const snapshot = await getDocs(clientsQuery);
      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      } as Client));
    } catch (error) {
      console.error("Error fetching clients:", error);
      return [];
    }
  }

  watchAll(
    userId: string,
    callback: (clients: Client[]) => void
  ): Unsubscribe {
    const clientsQuery = query(
      collection(db, this.collectionName),
      where("userId", "==", userId)
    );

    return onSnapshot(clientsQuery, (snapshot) => {
      const clients = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      } as Client));
      callback(clients);
    });
  }

  async getById(userId: string, clientId: string): Promise<Client | null> {
    try {
      const docRef = doc(db, this.collectionName, clientId);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        return null;
      }

      const data = snapshot.data();
      if (data.userId !== userId) {
        throw new Error("Unauthorized access to client");
      }

      return {
        ...data,
        id: snapshot.id,
      } as Client;
    } catch (error) {
      console.error("Error fetching client:", error);
      return null;
    }
  }

  async save(userId: string, client: Client): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, client.id);
      await setDoc(docRef, {
        ...client,
        userId,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("Error saving client:", error);
      throw error;
    }
  }

  async delete(userId: string, clientId: string): Promise<void> {
    try {
      // Verificar que el cliente pertenece al usuario
      const client = await this.getById(userId, clientId);
      if (!client) {
        throw new Error("Client not found");
      }

      const docRef = doc(db, this.collectionName, clientId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting client:", error);
      throw error;
    }
  }
}
