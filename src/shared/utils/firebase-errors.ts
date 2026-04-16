/**
 * Firebase Error Translator
 * Traduce códigos de error de Firebase a mensajes amigables en español.
 */

/** Mapa de códigos Firebase Auth → mensajes en español */
const firebaseAuthErrors: Record<string, string> = {
  // Login
  "auth/invalid-credential":
    "El correo o la contraseña son incorrectos. Verifica tus datos e intenta de nuevo.",
  "auth/user-not-found":
    "No existe una cuenta con ese correo electrónico.",
  "auth/wrong-password":
    "La contraseña es incorrecta. Intenta de nuevo.",
  "auth/invalid-email":
    "El correo electrónico no tiene un formato válido.",
  "auth/user-disabled":
    "Esta cuenta ha sido deshabilitada. Contacta al administrador.",

  // Register
  "auth/email-already-in-use":
    "Ya existe una cuenta registrada con ese correo electrónico.",
  "auth/weak-password":
    "La contraseña es muy débil. Usa al menos 6 caracteres.",
  "auth/operation-not-allowed":
    "El registro con correo y contraseña no está habilitado.",

  // Reset password
  "auth/missing-email":
    "Ingresa un correo electrónico para continuar.",

  // General / rate limiting
  "auth/too-many-requests":
    "Demasiados intentos fallidos. Espera unos minutos antes de intentar de nuevo.",
  "auth/network-request-failed":
    "Error de conexión. Verifica tu conexión a internet e intenta de nuevo.",
  "auth/internal-error":
    "Ocurrió un error interno. Intenta de nuevo más tarde.",
  "auth/requires-recent-login":
    "Tu sesión ha expirado. Inicia sesión nuevamente.",
  "auth/popup-closed-by-user":
    "Se cerró la ventana de autenticación antes de completar el proceso.",
};

/** Mapa de códigos Firestore → mensajes en español */
const firestoreErrors: Record<string, string> = {
  "permission-denied":
    "No tienes permisos para realizar esta acción.",
  "not-found":
    "El recurso solicitado no fue encontrado.",
  "already-exists":
    "Este registro ya existe en el sistema.",
  "resource-exhausted":
    "Se alcanzó el límite de operaciones. Intenta de nuevo más tarde.",
  "unavailable":
    "El servicio no está disponible. Verifica tu conexión e intenta de nuevo.",
  "deadline-exceeded":
    "La operación tardó demasiado. Intenta de nuevo.",
};

/**
 * Extrae el código de error de Firebase desde un error.
 * Firebase puede lanzar errores en formatos como:
 * - "Firebase: Error (auth/invalid-credential)."
 * - FirebaseError con propiedad `code`
 */
function extractFirebaseCode(error: unknown): string | null {
  // Si tiene propiedad `code` (FirebaseError)
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  ) {
    return (error as { code: string }).code;
  }

  // Si el message contiene un código entre paréntesis: "Firebase: Error (auth/xxx)."
  if (error instanceof Error) {
    const match = error.message.match(/\(([a-z-]+\/[a-z-]+)\)/);
    if (match) return match[1];
  }

  return null;
}

/**
 * Convierte cualquier error (especialmente Firebase) en un mensaje
 * amigable en español para mostrar al usuario.
 *
 * @param error - El error capturado en un catch
 * @param fallback - Mensaje por defecto si no se encuentra traducción
 * @returns Mensaje amigable en español
 */
export function getFirebaseErrorMessage(
  error: unknown,
  fallback = "Ocurrió un error inesperado. Intenta de nuevo."
): string {
  const code = extractFirebaseCode(error);

  if (code) {
    // Buscar en auth errors
    if (firebaseAuthErrors[code]) return firebaseAuthErrors[code];

    // Buscar en firestore errors (sin prefijo)
    const shortCode = code.replace(/^firestore\//, "");
    if (firestoreErrors[shortCode]) return firestoreErrors[shortCode];
  }

  // Si no es Firebase pero tiene message legible (no crudo)
  if (error instanceof Error && !error.message.includes("Firebase:")) {
    return error.message;
  }

  return fallback;
}
