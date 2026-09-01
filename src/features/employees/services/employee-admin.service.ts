/**
 * Orquestación del panel de administración de empleados (patrón pragmático).
 *
 * Combina la creación de cuentas de Firebase Auth (vía instancia secundaria,
 * `employee-provisioning.ts`) con las escrituras de Firestore que hace el
 * administrador en su sesión primaria.
 *
 * Todas las funciones asumen que `request.auth.uid == ownerUid` (el admin).
 */

import {
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "../../../shared/services/firebase/config";
import {
  businessCollection,
  defaultEmployee
} from "../../../shared/services/firebase/business.service";
import { provisionAuthUser } from "../../../shared/services/firebase/employee-provisioning";
import {
  buildSyntheticEmail,
  employeeLookupId,
  generateBusinessCode,
  slugifyLoginName
} from "../../../shared/utils/employee-credentials";
import {
  DEFAULT_ROLE_PRESET_ID,
  getRolePreset,
  sanitizePermissions
} from "../../../shared/constants";
import type { EmployeeDoc, UserProfile } from "../../../shared/types/models";

const CODE_COLLISION_RETRIES = 5;

function employeeDocRef(ownerUid: string, employeeId: string) {
  return doc(db, "businesses", ownerUid, "employees", employeeId);
}

function userDocRef(uid: string) {
  return doc(db, "users", uid);
}

/**
 * Devuelve el código corto del negocio, generándolo la primera vez.
 * El código se reserva en `businessCodes/{code}` para garantizar unicidad.
 */
export async function ensureBusinessCode(ownerUid: string): Promise<string> {
  const bizRef = doc(db, "businesses", ownerUid);
  const snapshot = await getDoc(bizRef);
  const existing = snapshot.data()?.code;
  if (typeof existing === "string" && existing.length > 0) {
    return existing;
  }

  let code = "";
  for (let attempt = 0; attempt < CODE_COLLISION_RETRIES; attempt += 1) {
    const candidate = generateBusinessCode();
    try {
      await setDoc(doc(db, "businessCodes", candidate), { ownerUid });
      code = candidate;
      break;
    } catch {
      // Colisión (las reglas solo permiten `create`): probar otro código.
    }
  }
  if (!code) {
    throw new Error("No se pudo generar un código de negocio. Intenta de nuevo.");
  }

  await updateDoc(bizRef, { code });
  return code;
}

export interface CreateEmployeeInput {
  loginName: string;
  password: string;
  displayName?: string;
  permissions: string[];
  rolePreset?: string;
}

export interface CreateEmployeeContext {
  ownerUid: string;
  adminUid: string;
  /** Se copian al perfil-espejo del empleado para que la app funcione sin gates. */
  ownerCountry: string;
  ownerMarket?: string;
  ownerBusinessName: string;
}

async function assertLoginNameAvailable(ownerUid: string, slug: string): Promise<void> {
  const existing = await getDocs(
    query(businessCollection(ownerUid, "employees"), where("loginNameSlug", "==", slug))
  );
  if (!existing.empty) {
    throw new Error("Ya existe un empleado con ese nombre de usuario.");
  }
}

/**
 * Crea un empleado: cuenta de Auth (instancia secundaria) + doc de negocio +
 * doc-espejo `users/{uid}` + índice de login. La sesión del admin no cambia.
 */
export async function createEmployee(
  context: CreateEmployeeContext,
  input: CreateEmployeeInput
): Promise<EmployeeDoc> {
  const { ownerUid, adminUid } = context;
  const loginName = input.loginName.trim();
  const slug = slugifyLoginName(loginName);
  if (!slug) {
    throw new Error("El nombre de usuario debe tener al menos una letra o número.");
  }

  const code = await ensureBusinessCode(ownerUid);
  await assertLoginNameAvailable(ownerUid, slug);

  const credV = 1;
  const [lookupId, syntheticEmail] = await Promise.all([
    employeeLookupId(code, slug),
    Promise.resolve(buildSyntheticEmail(slug, code, credV))
  ]);

  const rolePreset = input.rolePreset ?? DEFAULT_ROLE_PRESET_ID;
  const permissions = sanitizePermissions(input.permissions);
  const now = Date.now();
  const displayName = (input.displayName ?? loginName).trim() || loginName;

  const authUser = await provisionAuthUser(syntheticEmail, input.password, async ({ uid }) => {
    const employeeId = uid;

    const mirrorProfile: UserProfile = {
      uid,
      email: syntheticEmail,
      businessName: context.ownerBusinessName,
      createdAt: now,
      isActive: true,
      country: context.ownerCountry,
      market: context.ownerMarket,
      role: "employee",
      ownerUid,
      employeeId,
      loginName,
      loginNameSlug: slug,
      displayName,
      permissions,
      rolePreset,
      credV,
      syntheticEmail
    };

    const employeeDoc: EmployeeDoc = {
      ...defaultEmployee,
      id: employeeId,
      loginName,
      loginNameSlug: slug,
      displayName,
      permissions,
      rolePreset,
      isActive: true,
      credV,
      currentAuthUid: uid,
      syntheticEmail,
      createdAt: now,
      createdBy: adminUid,
      updatedAt: now
    };

    await setDoc(userDocRef(uid), mirrorProfile);
    await setDoc(employeeDocRef(ownerUid, employeeId), employeeDoc);
    await setDoc(doc(db, "empLogins", lookupId), {
      credV,
      isActive: true,
      ownerUid,
      employeeId
    });
  });

  return {
    ...defaultEmployee,
    id: authUser.uid,
    loginName,
    loginNameSlug: slug,
    displayName,
    permissions,
    rolePreset,
    isActive: true,
    credV,
    currentAuthUid: authUser.uid,
    syntheticEmail,
    createdAt: now,
    createdBy: adminUid,
    updatedAt: now
  };
}

/**
 * Rota la contraseña de un empleado: crea una cuenta de Auth nueva con email
 * sintético versionado (`credV + 1`) y desactiva el doc-espejo viejo. El
 * `employeeId` (id de negocio) NO cambia, así que el histórico se conserva.
 */
export async function setEmployeePassword(
  ownerUid: string,
  employee: EmployeeDoc,
  newPassword: string
): Promise<void> {
  const code = await ensureBusinessCode(ownerUid);
  const slug = employee.loginNameSlug;
  const nextV = employee.credV + 1;
  const newEmail = buildSyntheticEmail(slug, code, nextV);
  const lookupId = await employeeLookupId(code, slug);
  const now = Date.now();
  const previousAuthUid = employee.currentAuthUid;

  await provisionAuthUser(newEmail, newPassword, async ({ uid }) => {
    const mirrorProfile: UserProfile = {
      uid,
      email: newEmail,
      businessName: "",
      createdAt: now,
      isActive: true,
      country: "",
      role: "employee",
      ownerUid,
      employeeId: employee.id,
      loginName: employee.loginName,
      loginNameSlug: slug,
      displayName: employee.displayName,
      permissions: sanitizePermissions(employee.permissions),
      rolePreset: employee.rolePreset,
      credV: nextV,
      syntheticEmail: newEmail
    };

    // Doc-espejo nuevo. Se copian país/mercado/nombre del negocio desde el doc
    // del dueño para no dejar el perfil incompleto.
    const ownerSnap = await getDoc(doc(db, "users", ownerUid));
    const ownerData = ownerSnap.data() as Partial<UserProfile> | undefined;
    await setDoc(userDocRef(uid), {
      ...mirrorProfile,
      businessName: ownerData?.businessName ?? "",
      country: ownerData?.country ?? "CO",
      market: ownerData?.market
    });

    if (previousAuthUid && previousAuthUid !== uid) {
      await updateDoc(userDocRef(previousAuthUid), { isActive: false });
    }

    await updateDoc(employeeDocRef(ownerUid, employee.id), {
      currentAuthUid: uid,
      credV: nextV,
      syntheticEmail: newEmail,
      updatedAt: now
    });

    await updateDoc(doc(db, "empLogins", lookupId), { credV: nextV });
  });
}

/** Activa o desactiva un empleado (los tres documentos). */
export async function setEmployeeActive(
  ownerUid: string,
  employee: EmployeeDoc,
  active: boolean
): Promise<void> {
  const code = await ensureBusinessCode(ownerUid);
  const lookupId = await employeeLookupId(code, employee.loginNameSlug);
  const now = Date.now();

  await updateDoc(employeeDocRef(ownerUid, employee.id), { isActive: active, updatedAt: now });
  if (employee.currentAuthUid) {
    await updateDoc(userDocRef(employee.currentAuthUid), { isActive: active });
  }
  await updateDoc(doc(db, "empLogins", lookupId), { isActive: active });
}

/** Actualiza los permisos y el preset de un empleado. */
export async function updateEmployeePermissions(
  ownerUid: string,
  employee: EmployeeDoc,
  permissions: string[],
  rolePreset: string
): Promise<void> {
  const clean = sanitizePermissions(permissions);
  const preset = getRolePreset(rolePreset).id;
  const now = Date.now();

  await updateDoc(employeeDocRef(ownerUid, employee.id), {
    permissions: clean,
    rolePreset: preset,
    updatedAt: now
  });
  if (employee.currentAuthUid) {
    await updateDoc(userDocRef(employee.currentAuthUid), {
      permissions: clean,
      rolePreset: preset
    });
  }
}

/** Actualiza el nombre visible del empleado. */
export async function updateEmployeeDisplayName(
  ownerUid: string,
  employee: EmployeeDoc,
  displayName: string
): Promise<void> {
  const clean = displayName.trim() || employee.loginName;
  const now = Date.now();
  await updateDoc(employeeDocRef(ownerUid, employee.id), {
    displayName: clean,
    updatedAt: now
  });
  if (employee.currentAuthUid) {
    await updateDoc(userDocRef(employee.currentAuthUid), { displayName: clean });
  }
}
