/**
 * useInventory Hook
 * Acceso al contexto de inventario
 */

import { useContext } from "react";
import { InventoryContext } from "../../app/store/context/inventory.context";

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error("useInventory must be used within InventoryProvider");
  }
  return context;
}

export type { InventoryContextValue } from "../../app/store/context/inventory.context";
