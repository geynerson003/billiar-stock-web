import type { Permission } from "../../shared/constants";

/** Permiso (o `ADMIN_ONLY`) que exige cada ruta privada, en orden de menú. */
export interface RouteAccess {
  path: string;
  permission: Permission | "ADMIN_ONLY";
  /** Feature de mercado que además debe estar activa (ver `markets.ts`). */
  feature?: "tables";
}

export const ROUTE_ACCESS: RouteAccess[] = [
  { path: "/", permission: "dashboard.view" },
  { path: "/inventory", permission: "inventory.view" },
  { path: "/sales", permission: "sales.view" },
  { path: "/clients", permission: "clients.view" },
  { path: "/tables", permission: "tables.view", feature: "tables" },
  { path: "/expenses", permission: "expenses.view" },
  { path: "/reports", permission: "reports.view" },
  { path: "/employees", permission: "ADMIN_ONLY" },
  { path: "/settings", permission: "ADMIN_ONLY" },
];

export const NO_ACCESS_PATH = "/sin-acceso";
