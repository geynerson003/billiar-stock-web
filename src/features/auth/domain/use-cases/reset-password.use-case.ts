/**
 * Reset Password Use Case
 * Envía email para restablecer contraseña
 * 
 * Entrada: email
 * Salida: void
 */

import type { IUserAuthRepository } from "../interfaces";

export interface ResetPasswordInput {
    email: string;
}

export class ResetPasswordUseCase {
    constructor(private authRepository: IUserAuthRepository) { }

    async execute(input: ResetPasswordInput): Promise<void> {
        return this.authRepository.resetPassword(input.email);
    }
}
