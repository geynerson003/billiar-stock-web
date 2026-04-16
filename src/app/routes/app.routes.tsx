import { Navigate, Route, Routes } from "react-router-dom";
import {
  ForgotPasswordPage,
  LoginPage,
  RegisterPage,
} from "../../features/auth/presentation/pages";
import { ClientDebtPage, ClientsPage } from "../../features/clients/presentation/pages";
import { DashboardPage } from "../../features/dashboard/presentation/pages";
import { ExpensesPage } from "../../features/expenses/presentation/pages";
import { InventoryPage } from "../../features/inventory/presentation/pages";
import { ReportsPage } from "../../features/reports/presentation/pages";
import { SalesPage } from "../../features/sales/presentation/pages";
import { GameRoomPage, TablesPage } from "../../features/tables/presentation/pages";
import { GuestRoute, ProtectedRoute } from "./route-guards";

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <GuestRoute>
            <ForgotPasswordPage />
          </GuestRoute>
        }
      />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/clients/:clientId" element={<ClientDebtPage />} />
        <Route path="/tables" element={<TablesPage />} />
        <Route path="/tables/:tableId/:sessionId" element={<GameRoomPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
