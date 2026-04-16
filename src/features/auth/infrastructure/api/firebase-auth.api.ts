/**
 * Firebase Auth API
 * Wrapper de Firebase Auth - abstracción de la capa de infraestructura
 */

import type { User } from "firebase/auth";
import { firebaseAuthService } from "../../../../shared/services";

export class FirebaseAuthAPI {
    async login(email: string, password: string): Promise<User> {
        return firebaseAuthService.login(email, password);
    }

    async register(email: string, password: string): Promise<User> {
        return firebaseAuthService.register(email, password);
    }

    async logout(): Promise<void> {
        return firebaseAuthService.logout();
    }

    async resetPassword(email: string): Promise<void> {
        return firebaseAuthService.resetPassword(email);
    }

    onAuthStateChanged(callback: (user: User | null) => void) {
        return firebaseAuthService.onAuthStateChanged(callback);
    }

    getCurrentUser(): User | null {
        return firebaseAuthService.getCurrentUser();
    }
}

export const firebaseAuthAPI = new FirebaseAuthAPI();
