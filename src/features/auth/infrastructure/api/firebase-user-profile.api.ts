/**
 * Firebase User Profile API
 * Acceso a Firestore para perfiles de usuario
 */

import type { Unsubscribe } from "firebase/firestore";
import { firebaseFirestoreService } from "../../../../shared/services";
import type { UserProfile } from "../../domain/models";
import { defaultUserProfile } from "../../domain/models";
import { toMillis } from "../../../../shared/utils/type-guards";

export class FirebaseUserProfileAPI {
    /**
     * Observa cambios en el perfil del usuario
     */
    watchUserProfile(userId: string, callback: (profile: UserProfile | null) => void): Unsubscribe {
        const userDocRef = firebaseFirestoreService.getUserDoc<UserProfile>(userId);

        return firebaseFirestoreService.watchDoc(
            userDocRef,
            (snapshot: any) => {
                if (!snapshot.exists()) {
                    return null;
                }

                const data = snapshot.data();
                return {
                    ...defaultUserProfile,
                    ...data,
                    createdAt: toMillis(data?.createdAt)
                };
            },
            callback
        );
    }

    /**
     * Crea un nuevo perfil de usuario
     */
    async createUserProfile(
        userId: string,
        profile: UserProfile
    ): Promise<void> {
        const userDocRef = firebaseFirestoreService.getUserDoc<UserProfile>(userId);
        await firebaseFirestoreService.setDoc(userDocRef, profile);
    }

    /**
     * Crea documento de negocio
     */
    async createBusinessProfile(
        userId: string,
        data: { initialized: boolean; createdAt: number; businessName: string }
    ): Promise<void> {
        const businessDocRef = firebaseFirestoreService.getBusinessProfileDoc(userId);
        await firebaseFirestoreService.setDoc(businessDocRef, data);
    }

    /**
     * Obtiene perfil del usuario
     */
    async getUserProfile(userId: string): Promise<UserProfile | null> {
        const userDocRef = firebaseFirestoreService.getUserDoc<UserProfile>(userId);
        const data = await firebaseFirestoreService.getDoc(userDocRef);

        if (!data) return null;

        return {
            ...defaultUserProfile,
            ...data,
            createdAt: toMillis(data.createdAt)
        };
    }
}

export const firebaseUserProfileAPI = new FirebaseUserProfileAPI();
