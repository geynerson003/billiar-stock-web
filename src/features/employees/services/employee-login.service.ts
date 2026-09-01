/**
 * Resolución del email sintético de un empleado a partir de
 * `código de negocio + nombre de usuario`, para poder iniciar sesión con el
 * `login(email, password)` estándar.
 */

import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../shared/services/firebase/config";
import {
  buildSyntheticEmail,
  employeeLookupId,
  normalizeBusinessCode,
  slugifyLoginName
} from "../../../shared/utils/employee-credentials";

export const EMPLOYEE_BIZ_CODE_STORAGE_KEY = "mn.bizCode";

/** Error genérico: no revela si falló el código, el nombre o la contraseña. */
export class EmployeeLoginError extends Error {
  constructor(message = "Nombre o contraseña incorrectos.") {
    super(message);
    this.name = "EmployeeLoginError";
  }
}

/**
 * Devuelve el email sintético con el que autenticar al empleado.
 * Lanza `EmployeeLoginError` si el login no existe o está desactivado.
 */
export async function resolveEmployeeEmail(
  businessCode: string,
  loginName: string
): Promise<string> {
  const code = normalizeBusinessCode(businessCode);
  const slug = slugifyLoginName(loginName);
  if (!code || !slug) {
    throw new EmployeeLoginError();
  }

  const lookupId = await employeeLookupId(code, slug);
  const snapshot = await getDoc(doc(db, "empLogins", lookupId));
  if (!snapshot.exists()) {
    throw new EmployeeLoginError();
  }

  const data = snapshot.data();
  if (data.isActive === false) {
    throw new EmployeeLoginError("Esta cuenta de empleado está desactivada.");
  }

  const credV = typeof data.credV === "number" && data.credV > 0 ? data.credV : 1;
  return buildSyntheticEmail(slug, code, credV);
}
