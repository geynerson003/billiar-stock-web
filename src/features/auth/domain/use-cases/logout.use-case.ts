/**
 * Logout Use Case
 * Cierra la sesión del usuario actual
 */

import type { IUserAuthRepository } from "../interfaces";

export class LogoutUseCase {
    constructor(private authRepository: IUserAuthRepository) { }

    async execute(): Promise<void> {
        return this.authRepository.logout();
    }
}
