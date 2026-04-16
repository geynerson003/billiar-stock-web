/**
 * Auth Provider
 * Capa de presentación - proporciona autenticación a toda la app
 * Usa el contexto de React para compartir estado
 */

import type { PropsWithChildren } from "react";
import { createContext, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import type { UserProfile } from "../../../features/auth/domain/models";
import { AuthService } from "../../../features/auth/application/services/auth.service";
import { firebaseUserAuthRepository, firebaseUserProfileRepository } from "../../../features/auth/infrastructure";

// Inicializar el servicio con las implementaciones concretas
const authService = new AuthService(
  firebaseUserAuthRepository,
  firebaseUserProfileRepository
);

export interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, businessName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Observar cambios en el estado de autenticación
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((currentUser: User | null) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Observar cambios en el perfil del usuario
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    const unsubscribe = authService.watchUserProfile(user.uid, (data: UserProfile | null) => {
      setProfile(data);
    });

    return unsubscribe;
  }, [user]);

  // Memoizar el valor del contexto
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      login: async (email, password) => {
        await authService.login({ email, password });
      },
      register: async (email, password, businessName) => {
        await authService.register({ email, password, businessName });
      },
      logout: async () => {
        await authService.logout();
      },
      resetPassword: async (email) => {
        await authService.resetPassword({ email });
      }
    }),
    [loading, profile, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
