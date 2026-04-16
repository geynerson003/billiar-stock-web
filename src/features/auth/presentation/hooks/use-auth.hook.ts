/**
 * useAuth Hook
 * Custom hook para acceder al contexto de autenticación
 * 
 * Mantiene compatibilidad con el anterior useAuth
 * pero ahora usa la nueva arquitectura
 */

import { useContext } from "react";
import { AuthContext } from "../../../../app/store/context/auth.context";

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth debe usarse dentro de AuthProvider");
    }
    return context;
}
