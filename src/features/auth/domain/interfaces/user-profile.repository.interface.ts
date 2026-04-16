/**
 * User Profile Repository Interface
 * Contrato para gestión de perfiles de usuario
 */

import type { UserProfile } from "../models/user.model";
import type { Unsubscribe } from "firebase/firestore";

export interface IUserProfileRepository {
    /**
     * Observa cambios en el perfil del usuario
     */
    watchProfile(userId: string, callback: (profile: UserProfile | null) => void): Unsubscribe;

    /**
     * Obtiene el perfil del usuario
     */
    getProfile(userId: string): Promise<UserProfile | null>;

    /**
     * Crea un nuevo perfil de usuario
     */
    createProfile(userId: string, profile: UserProfile): Promise<void>;

    /**
     * Crea documento de negocio asociado
     */
    createBusiness(
        userId: string,
        data: { initialized: boolean; createdAt: number; businessName: string }
    ): Promise<void>;
}
