import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeader, Panel, useConfirmDialog } from "../../../../shared/components";
import { useBusinessId, useLiveCollection, useToast } from "../../../../shared/hooks";
import { businessCollection, mapEmployee } from "../../../../shared/services/firebase/business.service";
import { formatDate } from "../../../../shared/utils/format";
import type { Permission } from "../../../../shared/constants";
import {
  setEmployeeActive,
  setEmployeePassword,
  updateEmployeePermissions,
} from "../../services/employee-admin.service";
import { EmployeeMetrics } from "../components/EmployeeMetrics";
import { PasswordResetModal } from "../components/PasswordResetModal";
import { PermissionEditor } from "../components/PermissionEditor";

export function EmployeeDetailPage() {
  const { employeeId = "" } = useParams();
  const businessId = useBusinessId();
  const { toast } = useToast();
  const [confirmDialog, confirm] = useConfirmDialog();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const employees = useLiveCollection(
    () => (businessId ? businessCollection(businessId, "employees") : null),
    [businessId],
    mapEmployee
  );

  const employee = useMemo(
    () => employees.data.find((entry) => entry.id === employeeId) ?? null,
    [employees.data, employeeId]
  );

  const [draftPreset, setDraftPreset] = useState<string | null>(null);
  const [draftPermissions, setDraftPermissions] = useState<Permission[] | null>(null);

  const rolePreset = draftPreset ?? employee?.rolePreset ?? "custom";
  const permissions = draftPermissions ?? (employee?.permissions as Permission[] | undefined) ?? [];
  const dirty = draftPreset !== null || draftPermissions !== null;

  if (!employees.loading && !employee) {
    return (
      <div className="page">
        <PageHeader title="Empleado" description="No se encontró este empleado." />
        <Link className="button button--secondary" to="/employees">
          Volver
        </Link>
      </div>
    );
  }

  async function savePermissions() {
    if (!businessId || !employee) return;
    try {
      await updateEmployeePermissions(businessId, employee, permissions, rolePreset);
      setDraftPreset(null);
      setDraftPermissions(null);
      toast("success", "Permisos actualizados.");
    } catch {
      toast("error", "No se pudieron guardar los permisos.");
    }
  }

  async function changePassword(newPassword: string) {
    if (!businessId || !employee) return;
    await setEmployeePassword(businessId, employee, newPassword);
    toast("success", "Contraseña actualizada. El empleado debe volver a entrar.");
  }

  async function toggleActive() {
    if (!businessId || !employee) return;
    const nextActive = !employee.isActive;
    const confirmed = await confirm({
      title: nextActive ? "Activar empleado" : "Desactivar empleado",
      message: nextActive
        ? `${employee.displayName} podrá volver a iniciar sesión.`
        : `${employee.displayName} no podrá iniciar sesión ni usar la app.`,
      confirmLabel: nextActive ? "Activar" : "Desactivar",
    });
    if (!confirmed) return;
    try {
      await setEmployeeActive(businessId, employee, nextActive);
      toast("success", nextActive ? "Empleado activado." : "Empleado desactivado.");
    } catch {
      toast("error", "No se pudo actualizar el empleado.");
    }
  }

  return (
    <div className="page">
      {confirmDialog}

      <PageHeader
        eyebrow="Empleado"
        title={employee?.displayName ?? "Cargando…"}
        description={employee ? `Usuario: ${employee.loginName}` : ""}
        actions={
          <Link className="button button--secondary" to="/employees">
            Volver
          </Link>
        }
      />

      {employee && (
        <>
          <Panel title="Cuenta">
            <div className="stack-list">
              <div className="list-row">
                <span>Estado</span>
                <strong>{employee.isActive ? "Activo" : "Desactivado"}</strong>
              </div>
              <div className="list-row">
                <span>Creado</span>
                <strong>{formatDate(employee.createdAt)}</strong>
              </div>
            </div>
            <div className="inline-actions" style={{ marginTop: "12px" }}>
              <button
                className="button button--secondary"
                type="button"
                onClick={() => setPasswordModalOpen(true)}
              >
                Cambiar contraseña
              </button>
              <button className="button button--ghost" type="button" onClick={() => void toggleActive()}>
                {employee.isActive ? "Desactivar" : "Activar"}
              </button>
            </div>
          </Panel>

          <EmployeeMetrics employeeId={employee.id} />

          <Panel
            title="Permisos"
            actions={
              dirty ? (
                <button className="button button--primary" type="button" onClick={() => void savePermissions()}>
                  Guardar permisos
                </button>
              ) : undefined
            }
          >
            <PermissionEditor
              rolePreset={rolePreset}
              permissions={permissions}
              onChange={(next) => {
                setDraftPreset(next.rolePreset);
                setDraftPermissions(next.permissions);
              }}
            />
          </Panel>

          <PasswordResetModal
            open={passwordModalOpen}
            employeeName={employee.displayName}
            onClose={() => setPasswordModalOpen(false)}
            onSubmit={changePassword}
          />
        </>
      )}
    </div>
  );
}
