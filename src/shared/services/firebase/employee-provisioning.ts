/**
 * Aprovisionamiento de cuentas de empleado sin backend.
 *
 * El SDK cliente no puede crear un usuario de Firebase Auth sin cambiar la
 * sesión actual. Para no cerrar la sesión del administrador se usa una
 * **instancia secundaria** de la app de Firebase: crear el usuario ahí solo
 * afecta a `getAuth(secondaryApp).currentUser`, no a la sesión primaria que
 * observa `AuthProvider`.
 *
 * Tras cada operación la instancia secundaria se cierra por completo
 * (`signOut` + `deleteApp`).
 */

import { deleteApp, getApp, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  signOut,
  type Auth
} from "firebase/auth";
import { firebaseConfig } from "./config";

const SECONDARY_APP_NAME = "employee-provisioning";

function getSecondaryAuth(): Auth {
  let app;
  try {
    app = getApp(SECONDARY_APP_NAME);
  } catch {
    app = initializeApp(firebaseConfig, SECONDARY_APP_NAME);
  }
  return getAuth(app);
}

async function disposeSecondary(): Promise<void> {
  try {
    await signOut(getSecondaryAuth());
  } catch {
    /* noop */
  }
  try {
    await deleteApp(getApp(SECONDARY_APP_NAME));
  } catch {
    /* noop */
  }
}

export interface ProvisionedAuthUser {
  uid: string;
  email: string;
}

/**
 * Crea un usuario de Firebase Auth con `email` + `password` en la instancia
 * secundaria y ejecuta `writeProfile(user)` (que debe hacer las escrituras de
 * Firestore como el administrador de la sesión primaria).
 *
 * Si `writeProfile` falla, se elimina el usuario recién creado (rollback: en la
 * instancia secundaria seguimos autenticados como él, así que `deleteUser` está
 * permitido) y se relanza el error.
 *
 * Devuelve el `uid` del usuario creado. La instancia secundaria queda cerrada.
 */
export async function provisionAuthUser(
  email: string,
  password: string,
  writeProfile: (user: ProvisionedAuthUser) => Promise<void>
): Promise<ProvisionedAuthUser> {
  const secondaryAuth = getSecondaryAuth();
  const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
  const user: ProvisionedAuthUser = {
    uid: credential.user.uid,
    email
  };

  try {
    await writeProfile(user);
    return user;
  } catch (error) {
    try {
      await deleteUser(credential.user);
    } catch {
      /* usuario Auth huérfano inofensivo: no puede entrar sin `empLogins` */
    }
    throw error;
  } finally {
    await disposeSecondary();
  }
}
