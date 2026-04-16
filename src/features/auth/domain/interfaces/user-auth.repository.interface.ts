/**
 * Auth Repository Interface
 * Contrato que deben cumplir todas las implementaciones de Auth
 * Permite cambiar de Firebase a otra solución sin cambiar la lógica de negocio
 */

import type { User } from "firebase/auth";

export interface IUserAuthRepository {
    /**
     * Registra un nuevo usuario
     */
    register(email: string, password: string): Promise<User>;

    /**
     * Inicia sesión con email y contraseña
     */
    login(email: string, password: string): Promise<User>;

    /**
     * Cierra la sesión actual
     */
    logout(): Promise<void>;

    /**
     * Envía email de reset de contraseña
     */
    resetPassword(email: string): Promise<void>;

    /**
     * Obtiene el usuario actual
     */
    getCurrentUser(): User | null;

    /**
     * Observa cambios en el estado de auth
     */
    onAuthStateChanged(callback: (user: User | null) => void): () => void;
}
