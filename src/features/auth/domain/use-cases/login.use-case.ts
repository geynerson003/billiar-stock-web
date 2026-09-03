/**
 * Login Use Case
 * Autentica un usuario existente
 * 
 * Entrada: email, password
 * Salida: User (Firebase Auth User)
 */

import type { User } from "firebase/auth";
import type { IUserAuthRepository } from "../interfaces";

export interface LoginInput {
    email: string;
    password: string;
    /**
     * Mantener la sesión iniciada entre visitas. Por defecto `true`
     * (persistencia local). `false` limita la sesión a la pestaña actual.
     */
    rememberMe?: boolean;
}

export class LoginUseCase {
    constructor(private authRepository: IUserAuthRepository) { }

    async execute(input: LoginInput): Promise<User> {
        return this.authRepository.login(input.email, input.password, input.rememberMe);
    }
}
