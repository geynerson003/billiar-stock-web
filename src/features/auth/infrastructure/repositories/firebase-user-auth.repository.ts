/**
 * Firebase User Auth Repository
 * Implementación concreta del repositorio de autenticación
 */

import type { User } from "firebase/auth";
import type { IUserAuthRepository } from "../../domain/interfaces";
import { firebaseAuthAPI } from "../api/firebase-auth.api";

export class FirebaseUserAuthRepository implements IUserAuthRepository {
    async register(email: string, password: string): Promise<User> {
        return firebaseAuthAPI.register(email, password);
    }

    async login(email: string, password: string): Promise<User> {
        return firebaseAuthAPI.login(email, password);
    }

    async logout(): Promise<void> {
        return firebaseAuthAPI.logout();
    }

    async resetPassword(email: string): Promise<void> {
        return firebaseAuthAPI.resetPassword(email);
    }

    getCurrentUser(): User | null {
        return firebaseAuthAPI.getCurrentUser();
    }

    onAuthStateChanged(callback: (user: User | null) => void) {
        return firebaseAuthAPI.onAuthStateChanged(callback);
    }
}

export const firebaseUserAuthRepository = new FirebaseUserAuthRepository();
