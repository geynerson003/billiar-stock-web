/**
 * Firebase User Profile Repository
 * Implementación concreta para gestión de perfiles
 */

import type { Unsubscribe } from "firebase/firestore";
import type { IUserProfileRepository } from "../../domain/interfaces";
import type { UserProfile } from "../../domain/models";
import { firebaseUserProfileAPI } from "../api/firebase-user-profile.api";

export class FirebaseUserProfileRepository implements IUserProfileRepository {
    watchProfile(
        userId: string,
        callback: (profile: UserProfile | null) => void
    ): Unsubscribe {
        return firebaseUserProfileAPI.watchUserProfile(userId, callback);
    }

    async getProfile(userId: string): Promise<UserProfile | null> {
        return firebaseUserProfileAPI.getUserProfile(userId);
    }

    async createProfile(userId: string, profile: UserProfile): Promise<void> {
        return firebaseUserProfileAPI.createUserProfile(userId, profile);
    }

    async createBusiness(
        userId: string,
        data: { initialized: boolean; createdAt: number; businessName: string }
    ): Promise<void> {
        return firebaseUserProfileAPI.createBusinessProfile(userId, data);
    }
}

export const firebaseUserProfileRepository = new FirebaseUserProfileRepository();
