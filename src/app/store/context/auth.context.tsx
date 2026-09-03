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
import { getCountryOption } from "../../../shared/constants";
import { setActiveFormatConfig } from "../../../shared/utils";

// Inicializar el servicio con las implementaciones concretas
const authService = new AuthService(
  firebaseUserAuthRepository,
  firebaseUserProfileRepository
);

export interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  /** true una vez que el observador del perfil ha emitido al menos una vez. */
  profileLoaded: boolean;
  /** Rol efectivo. Ausencia de `profile.role` ⇒ "admin" (cuentas anteriores a multiusuario). */
  role: "admin" | "employee";
  isEmployee: boolean;
  /**
   * Id del negocio cuyos datos hay que leer/escribir: el uid del dueño. Para el
   * admin es su propio uid; para un empleado, `profile.ownerUid`. `null` mientras
   * el perfil no ha cargado o si un empleado no tiene `ownerUid`.
   */
  businessId: string | null;
  /** Solo empleados: id estable del empleado dentro del negocio. */
  employeeId: string | null;
  /** Id del actor para campos de autoría (`sellerId`, `registeredBy`, `createdBy`). */
  actorId: string | null;
  /** Permisos concedidos al empleado. Vacío para el admin (tiene todo implícito). */
  permissions: string[];
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (
    email: string,
    password: string,
    businessName: string,
    country: string,
    market: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Referencia estable para no romper la memoización cuando no hay permisos. */
const NO_PERMISSIONS: string[] = [];

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);

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
      const fallback = getCountryOption(null);
      setActiveFormatConfig({ locale: fallback.locale, currency: fallback.currency });
      setProfile(null);
      setProfileLoaded(false);
      return;
    }

    setProfileLoaded(false);
    const unsubscribe = authService.watchUserProfile(user.uid, (data: UserProfile | null) => {
      const { locale, currency } = getCountryOption(data?.country);
      setActiveFormatConfig({ locale, currency });
      setProfile(data);
      setProfileLoaded(true);
    });

    return unsubscribe;
  }, [user]);

  // Rol efectivo y "businessId" (uid del dueño) que consumen las páginas.
  const role: "admin" | "employee" = profile?.role === "employee" ? "employee" : "admin";
  const isEmployee = role === "employee";
  const businessId = isEmployee ? profile?.ownerUid ?? null : user?.uid ?? null;
  const employeeId = isEmployee ? profile?.employeeId ?? null : null;
  const actorId = isEmployee ? profile?.employeeId ?? null : user?.uid ?? null;
  const permissions = isEmployee ? profile?.permissions ?? NO_PERMISSIONS : NO_PERMISSIONS;

  // Memoizar el valor del contexto
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      profileLoaded,
      role,
      isEmployee,
      businessId,
      employeeId,
      actorId,
      permissions,
      login: async (email, password, rememberMe = true) => {
        await authService.login({ email, password, rememberMe });
      },
      register: async (email, password, businessName, country, market) => {
        await authService.register({ email, password, businessName, country, market });
      },
      logout: async () => {
        await authService.logout();
      },
      resetPassword: async (email) => {
        await authService.resetPassword({ email });
      },
      updateProfile: async (patch) => {
        if (!user) throw new Error("No hay sesión activa.");
        await authService.updateProfile({ userId: user.uid, patch });
      }
    }),
    [
      loading,
      profile,
      profileLoaded,
      user,
      role,
      isEmployee,
      businessId,
      employeeId,
      actorId,
      permissions
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
