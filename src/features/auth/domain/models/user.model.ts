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
    /** Código ISO-3166 alpha-2 del país. Determina moneda y locale. */
    country: string;
    /**
     * Tipo de negocio elegido en el registro (ver `src/shared/constants/markets.ts`).
     * Determina terminología y qué secciones se muestran. Opcional: los perfiles
     * antiguos no lo tienen y se les pide en un gate de onboarding.
     */
    market?: string;
    /**
     * Rol dentro del negocio. Ausente ⇒ administrador/dueño (compatibilidad con
     * cuentas anteriores a multiusuario). Ver `src/shared/constants/permissions.ts`.
     */
    role?: "admin" | "employee";
    /** Solo empleados: uid del dueño del negocio (= businessId efectivo). */
    ownerUid?: string;
    /**
     * Solo empleados: id estable del empleado dentro del negocio. Se usa como
     * `sellerId`/autoría y NO cambia al resetear la contraseña.
     */
    employeeId?: string;
    /** Solo empleados: nombre de usuario para iniciar sesión, tal cual lo escribió el admin. */
    loginName?: string;
    /**
     * Solo empleados: `loginName` normalizado (minúsculas, sin acentos,
     * `[^a-z0-9]+` → `-`). Único por negocio.
     */
    loginNameSlug?: string;
    /** Solo empleados: nombre visible en el panel del admin. */
    displayName?: string;
    /** Solo empleados: permisos concedidos (ids de `Permission`). */
    permissions?: string[];
    /** Solo empleados: preset de rol aplicado (`vendedor` | `encargado` | `custom`). Metadato de UI. */
    rolePreset?: string;
    /** Solo empleados: versión de credencial. Se incrementa en cada reseteo de contraseña. */
    credV?: number;
    /** Solo empleados: email sintético con el que se autentican en Firebase Auth. */
    syntheticEmail?: string;
}

export const defaultUserProfile: UserProfile = {
    uid: "",
    email: "",
    businessName: "",
    createdAt: Date.now(),
    isActive: true,
    country: "CO"
};
