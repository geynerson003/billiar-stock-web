/**
 * Register Use Case
 * Registra un nuevo usuario con su perfil de negocio
 * 
 * Entrada: email, password, businessName
 * Salida: User (Firebase Auth User)
 * 
 * Procesa:
 * 1. Registra el usuario en Firebase Auth
 * 2. Crea perfil de usuario en Firestore (collection: users)
 * 3. Crea documento de negocio en Firestore (collection: businesses)
 */

import type { User } from "firebase/auth";
import type { IUserAuthRepository, IUserProfileRepository } from "../interfaces";
import type { UserProfile } from "../models";
import { defaultUserProfile } from "../models";

export interface RegisterInput {
    email: string;
    password: string;
    businessName: string;
}

export class RegisterUseCase {
    constructor(
        private authRepository: IUserAuthRepository,
        private profileRepository: IUserProfileRepository
    ) { }

    async execute(input: RegisterInput): Promise<User> {
        // 1. Crear usuario en Firebase Auth
        const user = await this.authRepository.register(input.email, input.password);

        try {
            // 2. Crear perfil de usuario
            const newProfile: UserProfile = {
                ...defaultUserProfile,
                uid: user.uid,
                email: input.email,
                businessName: input.businessName,
                createdAt: Date.now()
            };

            await this.profileRepository.createProfile(user.uid, newProfile);

            // 3. Crear documento de negocio
            await this.profileRepository.createBusiness(user.uid, {
                initialized: true,
                createdAt: Date.now(),
                businessName: input.businessName
            });

            return user;
        } catch (error) {
            // Si falla la creación de perfiles, eliminar el usuario de auth
            // (en producción, usar una función de rollback)
            throw new Error("No fue posible completar el registro del perfil. Intenta de nuevo.");
        }
    }
}
