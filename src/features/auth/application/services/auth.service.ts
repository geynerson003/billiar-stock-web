/**
 * Auth Application Service
 * Orquesta los use cases de autenticación
 * Punto de entrada para la capa de presentación
 */

import type { User } from "firebase/auth";
import type { IUserAuthRepository, IUserProfileRepository } from "../../domain/interfaces";
import {
    LoginUseCase,
    LogoutUseCase,
    RegisterUseCase,
    ResetPasswordUseCase,
    type LoginInput,
    type RegisterInput,
    type ResetPasswordInput
} from "../../domain/use-cases";

export class AuthService {
    private loginUseCase: LoginUseCase;
    private registerUseCase: RegisterUseCase;
    private logoutUseCase: LogoutUseCase;
    private resetPasswordUseCase: ResetPasswordUseCase;

    constructor(
        private authRepository: IUserAuthRepository,
        private profileRepository: IUserProfileRepository
    ) {
        this.loginUseCase = new LoginUseCase(authRepository);
        this.registerUseCase = new RegisterUseCase(authRepository, profileRepository);
        this.logoutUseCase = new LogoutUseCase(authRepository);
        this.resetPasswordUseCase = new ResetPasswordUseCase(authRepository);
    }

    /**
     * Inicia sesión del usuario
     */
    async login(input: LoginInput): Promise<User> {
        return this.loginUseCase.execute(input);
    }

    /**
     * Registra un nuevo usuario
     */
    async register(input: RegisterInput): Promise<User> {
        return this.registerUseCase.execute(input);
    }

    /**
     * Cierra la sesión
     */
    async logout(): Promise<void> {
        return this.logoutUseCase.execute();
    }

    /**
     * Envía email para restablecer contraseña
     */
    async resetPassword(input: ResetPasswordInput): Promise<void> {
        return this.resetPasswordUseCase.execute(input);
    }

    /**
     * Obtiene el usuario actual
     */
    getCurrentUser(): User | null {
        return this.authRepository.getCurrentUser();
    }

    /**
     * Observa cambios en el estado de autenticación
     */
    onAuthStateChanged(callback: (user: User | null) => void) {
        return this.authRepository.onAuthStateChanged(callback);
    }

    /**
     * Observa cambios en el perfil del usuario
     */
    watchUserProfile(userId: string, callback: (profile: any) => void) {
        return this.profileRepository.watchProfile(userId, callback);
    }
}
