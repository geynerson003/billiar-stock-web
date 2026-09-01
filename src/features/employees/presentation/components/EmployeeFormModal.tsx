import { useState, type FormEvent } from "react";
import { Modal } from "../../../../shared/components";
import {
  DEFAULT_ROLE_PRESET_ID,
  getRolePreset,
  type Permission,
} from "../../../../shared/constants";
import { PermissionEditor } from "./PermissionEditor";

export interface EmployeeFormValues {
  loginName: string;
  displayName: string;
  password: string;
  rolePreset: string;
  permissions: Permission[];
}

interface EmployeeFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: EmployeeFormValues) => Promise<void>;
}

const MIN_PASSWORD_LENGTH = 6;

export function EmployeeFormModal({ open, onClose, onSubmit }: EmployeeFormModalProps) {
  const [loginName, setLoginName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [rolePreset, setRolePreset] = useState(DEFAULT_ROLE_PRESET_ID);
  const [permissions, setPermissions] = useState<Permission[]>(
    () => [...getRolePreset(DEFAULT_ROLE_PRESET_ID).permissions]
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reset() {
    setLoginName("");
    setDisplayName("");
    setPassword("");
    setRolePreset(DEFAULT_ROLE_PRESET_ID);
    setPermissions([...getRolePreset(DEFAULT_ROLE_PRESET_ID).permissions]);
    setError(null);
    setSaving(false);
  }

  function handleClose() {
    if (saving) return;
    reset();
    onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!loginName.trim()) {
      setError("El nombre de usuario es obligatorio.");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        loginName: loginName.trim(),
        displayName: displayName.trim() || loginName.trim(),
        password,
        rolePreset,
        permissions,
      });
      reset();
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No fue posible crear el empleado."
      );
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Nuevo empleado" onClose={handleClose}>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>Nombre de usuario</span>
          <input
            required
            value={loginName}
            onChange={(event) => setLoginName(event.target.value)}
            placeholder="Ej: Juan"
            autoComplete="off"
          />
          <small>El empleado lo usará junto al código del negocio para entrar.</small>
        </label>

        <label className="field">
          <span>Nombre visible (opcional)</span>
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Ej: Juan Pérez"
          />
        </label>

        <label className="field">
          <span>Contraseña</span>
          <input
            required
            type="text"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
          />
          <small>Compártela con el empleado. Podrás cambiarla luego.</small>
        </label>

        <PermissionEditor
          rolePreset={rolePreset}
          permissions={permissions}
          onChange={(next) => {
            setRolePreset(next.rolePreset);
            setPermissions(next.permissions);
          }}
        />

        {error && <div className="alert alert--error">{error}</div>}

        <div className="inline-actions">
          <button
            className="button button--secondary"
            type="button"
            onClick={handleClose}
            disabled={saving}
          >
            Cancelar
          </button>
          <button className="button button--primary" type="submit" disabled={saving}>
            {saving && <span className="button__spinner" />}
            {saving ? "Creando…" : "Crear empleado"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
