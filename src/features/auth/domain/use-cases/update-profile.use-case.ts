/**
 * Update Profile Use Case
 * Actualiza campos del perfil del usuario (merge parcial).
 *
 * Entrada: userId + patch parcial de UserProfile
 * Salida: void
 */

import type { IUserProfileRepository } from "../interfaces";
import type { UserProfile } from "../models";

export interface UpdateProfileInput {
    userId: string;
    patch: Partial<UserProfile>;
}

export class UpdateProfileUseCase {
    constructor(private profileRepository: IUserProfileRepository) { }

    async execute(input: UpdateProfileInput): Promise<void> {
        return this.profileRepository.updateProfile(input.userId, input.patch);
    }
}
