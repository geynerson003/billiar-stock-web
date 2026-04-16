/**
 * Client Service
 * Orquestación de casos de uso relacionados con clientes
 */

import type { Client } from "../../domain/models/client.model";
import type { IClientRepository } from "../../domain/interfaces/client.repository.interface";
import { FirebaseClientRepository } from "../../infrastructure/repositories/firebase-client.repository";

export class ClientService {
  private repository: IClientRepository;

  constructor(repository?: IClientRepository) {
    this.repository = repository || new FirebaseClientRepository();
  }

  /**
   * Obtiene todos los clientes del usuario actual
   */
  async getAllClients(userId: string): Promise<Client[]> {
    try {
      return await this.repository.getAll(userId);
    } catch (error) {
      console.error("Error getting all clients:", error);
      throw new Error("No se pudieron obtener los clientes");
    }
  }

  /**
   * Observador en tiempo real de clientes
   */
  watchClients(userId: string, callback: (clients: Client[]) => void) {
    return this.repository.watchAll(userId, callback);
  }

  /**
   * Obtiene un cliente específico por ID
   */
  async getClientById(userId: string, clientId: string): Promise<Client | null> {
    try {
      return await this.repository.getById(userId, clientId);
    } catch (error) {
      console.error("Error getting client:", error);
      return null;
    }
  }

  /**
   * Crea un nuevo cliente
   */
  async createClient(userId: string, clientData: Omit<Client, "id">): Promise<Client> {
    try {
      const newClient: Client = {
        ...clientData,
        id: `client_${Date.now()}`,
      };

      await this.repository.save(userId, newClient);
      return newClient;
    } catch (error) {
      console.error("Error creating client:", error);
      throw new Error("No se pudo crear el cliente");
    }
  }

  /**
   * Actualiza un cliente existente
   */
  async updateClient(userId: string, clientId: string, updates: Partial<Client>): Promise<void> {
    try {
      const existingClient = await this.repository.getById(userId, clientId);

      if (!existingClient) {
        throw new Error("Cliente no encontrado");
      }

      const updatedClient: Client = {
        ...existingClient,
        ...updates,
        id: clientId, // Asegurar que el ID no cambie
      };

      await this.repository.save(userId, updatedClient);
    } catch (error) {
      console.error("Error updating client:", error);
      throw error;
    }
  }

  /**
   * Elimina un cliente
   */
  async deleteClient(userId: string, clientId: string): Promise<void> {
    try {
      await this.repository.delete(userId, clientId);
    } catch (error) {
      console.error("Error deleting client:", error);
      throw new Error("No se pudo eliminar el cliente");
    }
  }

  /**
   * Busca clientes por nombre
   */
  async searchClients(userId: string, keyword: string): Promise<Client[]> {
    try {
      const allClients = await this.repository.getAll(userId);
      const lowerKeyword = keyword.toLowerCase();

      return allClients.filter((client) =>
        client.nombre?.toLowerCase().includes(lowerKeyword) ||
        client.telefono?.includes(keyword)
      );
    } catch (error) {
      console.error("Error searching clients:", error);
      return [];
    }
  }

  /**
   * Calcula deuda total de un cliente
   */
  calculateClientDebt(client: Client): number {
    return client.deuda || 0;
  }
}
