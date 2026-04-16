/**
 * User Profile Model
 * Modelo de dominio para Usuario
 */

export interface UserProfile {
    uid: string;
    email: string;
    businessName: string;
    createdAt: number;
    isActive: boolean;
}

export const defaultUserProfile: UserProfile = {
    uid: "",
    email: "",
    businessName: "",
    createdAt: Date.now(),
    isActive: true
};
