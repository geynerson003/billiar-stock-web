/**
 * App Providers
 * Wrapper de todos los providers de la aplicación
 */

import type { PropsWithChildren } from "react";
import { AuthProvider } from "../../features/auth/presentation/providers/auth.provider";
import { InventoryProvider } from "../store/context/inventory.context";
import { ToastProvider } from "./toast.provider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <InventoryProvider>
        <ToastProvider>{children}</ToastProvider>
      </InventoryProvider>
    </AuthProvider>
  );
}
