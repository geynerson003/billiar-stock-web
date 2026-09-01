/**
 * Utilidades para las credenciales sintéticas de los empleados.
 *
 * Un empleado no tiene correo real: se autentica en Firebase Auth con un email
 * derivado de forma determinista de `código de negocio + nombre + versión de
 * credencial`. Así el login solo necesita leer `credV` del índice `empLogins`.
 */

/** Dominio de los emails sintéticos de empleados (no recibe correo real). */
export const EMPLOYEE_EMAIL_DOMAIN = "emp.minegocio.app";

/** Alfabeto del código de negocio: sin caracteres ambiguos (0/O, 1/I/L). */
const BUSINESS_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const BUSINESS_CODE_LENGTH = 6;

/** Rango Unicode de marcas diacríticas combinantes (para quitar acentos). */
const COMBINING_MARKS = /[̀-ͯ]/g;

/**
 * Normaliza el nombre de usuario del empleado: minúsculas, sin acentos, y
 * `[^a-z0-9]+` colapsado a `-`. Debe ser único dentro de un negocio.
 */
export function slugifyLoginName(value: string): string {
  return value
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Normaliza el código de negocio tal como lo teclea el empleado. */
export function normalizeBusinessCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

/** Genera un código de negocio aleatorio. */
export function generateBusinessCode(): string {
  const bytes = new Uint8Array(BUSINESS_CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let code = "";
  for (const byte of bytes) {
    code += BUSINESS_CODE_ALPHABET[byte % BUSINESS_CODE_ALPHABET.length];
  }
  return code;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Id del documento `empLogins/{lookupId}` para un negocio + nombre de usuario.
 * Requiere conocer el código exacto (que ya es un secreto compartido).
 */
export function employeeLookupId(businessCode: string, loginNameSlug: string): Promise<string> {
  return sha256Hex(`${normalizeBusinessCode(businessCode)}|${loginNameSlug}`);
}

/**
 * Email sintético con el que el empleado se autentica en Firebase Auth.
 * `credV` cambia en cada reseteo de contraseña (rotación de credencial).
 */
export function buildSyntheticEmail(
  loginNameSlug: string,
  businessCode: string,
  credV: number
): string {
  return `${loginNameSlug}--v${credV}--${normalizeBusinessCode(businessCode).toLowerCase()}@${EMPLOYEE_EMAIL_DOMAIN}`;
}
