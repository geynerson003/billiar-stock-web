import { Route, Routes } from "react-router-dom";
import {
  EmployeeLoginPage,
  ForgotPasswordPage,
  LoginPage,
  RegisterPage,
} from "../../features/auth/presentation/pages";
import { ClientDebtPage, ClientsPage } from "../../features/clients/presentation/pages";
import { DashboardPage } from "../../features/dashboard/presentation/pages";
import { EmployeeDetailPage, EmployeesPage } from "../../features/employees/presentation/pages";
import { ExpensesPage } from "../../features/expenses/presentation/pages";
import { InventoryPage } from "../../features/inventory/presentation/pages";
import { ReportsPage } from "../../features/reports/presentation/pages";
import { SalesPage } from "../../features/sales/presentation/pages";
import { SettingsPage } from "../../features/settings/presentation/pages";
import { GameRoomPage, TablesPage } from "../../features/tables/presentation/pages";
import {
  GuestRoute,
  MarketFeatureRoute,
  NoAccessScreen,
  NotFoundScreen,
  PermissionRoute,
  ProtectedRoute,
} from "./route-guards";
import { NO_ACCESS_PATH } from "./route-access";

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
        path="/staff-login"
        element={
          <GuestRoute>
            <EmployeeLoginPage />
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
        <Route
          path="/"
          element={
            <PermissionRoute perm="dashboard.view">
              <DashboardPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <PermissionRoute perm="inventory.view">
              <InventoryPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/sales"
          element={
            <PermissionRoute perm="sales.view">
              <SalesPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/clients"
          element={
            <PermissionRoute perm="clients.view">
              <ClientsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/clients/:clientId"
          element={
            <PermissionRoute perm="clients.view">
              <ClientDebtPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/tables"
          element={
            <MarketFeatureRoute feature="tables">
              <PermissionRoute perm="tables.view">
                <TablesPage />
              </PermissionRoute>
            </MarketFeatureRoute>
          }
        />
        <Route
          path="/tables/:tableId/:sessionId"
          element={
            <MarketFeatureRoute feature="tables">
              <PermissionRoute perm="tables.view">
                <GameRoomPage />
              </PermissionRoute>
            </MarketFeatureRoute>
          }
        />
        <Route
          path="/expenses"
          element={
            <PermissionRoute perm="expenses.view">
              <ExpensesPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <PermissionRoute perm="reports.view">
              <ReportsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <PermissionRoute perm="ADMIN_ONLY">
              <EmployeesPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/employees/:employeeId"
          element={
            <PermissionRoute perm="ADMIN_ONLY">
              <EmployeeDetailPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PermissionRoute perm="ADMIN_ONLY">
              <SettingsPage />
            </PermissionRoute>
          }
        />
        <Route path={NO_ACCESS_PATH} element={<NoAccessScreen />} />
        <Route path="*" element={<NotFoundScreen />} />
      </Route>
    </Routes>
  );
}
