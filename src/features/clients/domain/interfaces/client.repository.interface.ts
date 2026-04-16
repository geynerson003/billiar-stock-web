/**
 * Client Repository Interface
 */

import type { Client } from "../models/client.model";

export interface IClientRepository {
    /**
     * Obtiene todos los clientes del usuario
     */
    getAll(userId: string): Promise<Client[]>;

    /**
     * Observa cambios en todos los clientes
     */
    watchAll(userId: string, callback: (clients: Client[]) => void): () => void;

    /**
     * Obtiene un cliente específico
     */
    getById(userId: string, clientId: string): Promise<Client | null>;

    /**
     * Crea o actualiza un cliente
     */
    save(userId: string, client: Client): Promise<void>;

    /**
     * Elimina un cliente
     */
    delete(userId: string, clientId: string): Promise<void>;
}
