import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, Panel, useConfirmDialog } from "../../../../shared/components";
import { useAuth, useBusinessId, useLiveCollection, useToast } from "../../../../shared/hooks";
import { businessCollection, mapEmployee } from "../../../../shared/services/firebase/business.service";
import {
  createEmployee,
  ensureBusinessCode,
  setEmployeeActive,
} from "../../services/employee-admin.service";
import { EmployeeFormModal, type EmployeeFormValues } from "../components/EmployeeFormModal";

export function EmployeesPage() {
  const { user, profile } = useAuth();
  const businessId = useBusinessId();
  const { toast } = useToast();
  const [confirmDialog, confirm] = useConfirmDialog();
  const [modalOpen, setModalOpen] = useState(false);
  const [businessCode, setBusinessCode] = useState<string | null>(null);

  const employees = useLiveCollection(
    () => (businessId ? businessCollection(businessId, "employees") : null),
    [businessId],
    mapEmployee
  );

  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    ensureBusinessCode(businessId)
      .then((code) => {
        if (!cancelled) setBusinessCode(code);
      })
      .catch(() => {
        if (!cancelled) toast("error", "No se pudo obtener el código del negocio.");
      });
    return () => {
      cancelled = true;
    };
  }, [businessId, toast]);

  async function handleCreate(values: EmployeeFormValues) {
    if (!businessId || !user) return;
    await createEmployee(
      {
        ownerUid: businessId,
        adminUid: user.uid,
        ownerCountry: profile?.country ?? "CO",
        ownerMarket: profile?.market,
        ownerBusinessName: profile?.businessName ?? "",
      },
      values
    );
    toast("success", "Empleado creado.");
  }

  async function toggleActive(employeeId: string) {
    const employee = employees.data.find((entry) => entry.id === employeeId);
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

  function copyCode() {
    if (!businessCode) return;
    navigator.clipboard?.writeText(businessCode).then(
      () => toast("success", "Código copiado."),
      () => toast("warning", "No se pudo copiar automáticamente.")
    );
  }

  return (
    <div className="page">
      {confirmDialog}

      <PageHeader
        eyebrow="Equipo"
        title="Empleados"
        description="Crea cuentas para tus trabajadores y controla qué puede ver y hacer cada uno."
        actions={
          <button className="button button--primary" type="button" onClick={() => setModalOpen(true)}>
            Nuevo empleado
          </button>
        }
      />

      <Panel title="Código del negocio" subtitle="Tus empleados lo necesitan para iniciar sesión">
        <div className="inline-actions" style={{ alignItems: "center" }}>
          <strong style={{ fontSize: "1.4rem", letterSpacing: "0.15em" }}>
            {businessCode ?? "········"}
          </strong>
          <button
            className="button button--secondary"
            type="button"
            onClick={copyCode}
            disabled={!businessCode}
          >
            Copiar
          </button>
        </div>
      </Panel>

      <Panel title="Empleados" subtitle={`${employees.data.length} registrados`}>
        <div className="stack-list">
          {employees.data.length === 0 && (
            <div className="empty-state">Aún no has creado empleados.</div>
          )}
          {employees.data.map((employee) => (
            <div className="list-row list-row--expanded" key={employee.id}>
              <div>
                <strong>{employee.displayName}</strong>
                <span>
                  usuario: {employee.loginName} · {employee.isActive ? "activo" : "desactivado"}
                </span>
              </div>
              <div className="inline-actions">
                <button
                  className="button button--ghost"
                  type="button"
                  onClick={() => void toggleActive(employee.id)}
                >
                  {employee.isActive ? "Desactivar" : "Activar"}
                </button>
                <Link className="button button--secondary" to={`/employees/${employee.id}`}>
                  Gestionar
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <EmployeeFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
