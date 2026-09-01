/**
 * Catálogo de permisos (RBAC) para empleados.
 *
 * Patrón idéntico al de `markets.ts`: catálogo tipado + resolutores. El
 * administrador/dueño tiene todos los permisos de forma implícita (nunca se le
 * consulta este catálogo). Los permisos `employees.manage` y `settings.manage`
 * NO son asignables: son exclusivos del admin y se comprueban con `isAdmin`.
 *
 * El enforcement de esta matriz vive en la capa de presentación (menú, guards de
 * ruta y botones). Las reglas de Firestore solo garantizan el aislamiento entre
 * negocios y que el empleado esté activo (ver `firestore.rules`).
 */

export type Permission =
  | "dashboard.view"
  | "inventory.view"
  | "inventory.edit"
  | "inventory.delete"
  | "sales.view"
  | "sales.create"
  | "sales.delete"
  | "clients.view"
  | "clients.edit"
  | "clients.delete"
  | "clients.payments"
  | "tables.view"
  | "tables.manage"
  | "tables.delete"
  | "expenses.view"
  | "expenses.create"
  | "expenses.edit"
  | "expenses.delete"
  | "reports.view";

export interface PermissionMeta {
  id: Permission;
  label: string;
  /** Acción destructiva: se resalta en el editor de permisos. */
  destructive?: boolean;
}

export interface PermissionGroup {
  section: string;
  label: string;
  items: PermissionMeta[];
}

/** Grupos para el editor de permisos del panel de administración. */
export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    section: "dashboard",
    label: "Panel principal",
    items: [{ id: "dashboard.view", label: "Ver el panel principal" }],
  },
  {
    section: "inventory",
    label: "Inventario",
    items: [
      { id: "inventory.view", label: "Ver productos y stock" },
      { id: "inventory.edit", label: "Crear y editar productos" },
      { id: "inventory.delete", label: "Eliminar productos", destructive: true },
    ],
  },
  {
    section: "sales",
    label: "Ventas",
    items: [
      { id: "sales.view", label: "Ver el historial de ventas" },
      { id: "sales.create", label: "Registrar ventas" },
      { id: "sales.delete", label: "Eliminar ventas", destructive: true },
    ],
  },
  {
    section: "clients",
    label: "Clientes y deudas",
    items: [
      { id: "clients.view", label: "Ver clientes y deudas" },
      { id: "clients.edit", label: "Crear y editar clientes" },
      { id: "clients.payments", label: "Registrar abonos / pagos" },
      { id: "clients.delete", label: "Eliminar clientes", destructive: true },
    ],
  },
  {
    section: "tables",
    label: "Mesas",
    items: [
      { id: "tables.view", label: "Ver mesas y abrir sesiones" },
      { id: "tables.manage", label: "Operar partidas / cuentas y configurar mesas" },
      { id: "tables.delete", label: "Eliminar mesas", destructive: true },
    ],
  },
  {
    section: "expenses",
    label: "Gastos",
    items: [
      { id: "expenses.view", label: "Ver los gastos" },
      { id: "expenses.create", label: "Registrar gastos" },
      { id: "expenses.edit", label: "Editar gastos" },
      { id: "expenses.delete", label: "Eliminar gastos", destructive: true },
    ],
  },
  {
    section: "reports",
    label: "Reportes",
    items: [{ id: "reports.view", label: "Ver los reportes del negocio" }],
  },
];

/** Todos los permisos asignables a un empleado. */
export const ALL_ASSIGNABLE: Permission[] = PERMISSION_GROUPS.flatMap((group) =>
  group.items.map((item) => item.id)
);

export interface RolePreset {
  id: string;
  label: string;
  description: string;
  permissions: Permission[];
}

/**
 * Presets de rol: precargan una selección de permisos que el admin puede luego
 * ajustar permiso por permiso. `custom` no precarga nada.
 */
export const ROLE_PRESETS: RolePreset[] = [
  {
    id: "vendedor",
    label: "Vendedor",
    description: "Vende y cobra. No ve costos, gastos ni reportes.",
    permissions: [
      "dashboard.view",
      "sales.view",
      "sales.create",
      "clients.view",
      "clients.payments",
      "inventory.view",
      "tables.view",
      "tables.manage",
    ],
  },
  {
    id: "encargado",
    label: "Encargado",
    description: "Opera todo el negocio salvo la gestión de empleados y los ajustes.",
    permissions: [...ALL_ASSIGNABLE],
  },
  {
    id: "custom",
    label: "Personalizado",
    description: "Elige permiso por permiso.",
    permissions: [],
  },
];

export const DEFAULT_ROLE_PRESET_ID = "vendedor";

const PERMISSION_SET = new Set<string>(ALL_ASSIGNABLE);
const ROLE_PRESET_BY_ID = new Map(ROLE_PRESETS.map((preset) => [preset.id, preset]));

/** True si `value` corresponde a un permiso conocido y asignable. */
export function isKnownPermission(value: string): value is Permission {
  return PERMISSION_SET.has(value);
}

/** Filtra una lista arbitraria dejando solo permisos conocidos. */
export function sanitizePermissions(values: readonly string[]): Permission[] {
  return values.filter(isKnownPermission);
}

/** Devuelve el preset de rol indicado, o `custom` si el id es desconocido. */
export function getRolePreset(id?: string | null): RolePreset {
  return (
    (id ? ROLE_PRESET_BY_ID.get(id) : undefined) ?? ROLE_PRESET_BY_ID.get("custom")!
  );
}
