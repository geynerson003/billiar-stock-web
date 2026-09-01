import { useState, type FormEvent } from "react";
import { Modal } from "../../../../shared/components";

interface PasswordResetModalProps {
  open: boolean;
  employeeName: string;
  onClose: () => void;
  onSubmit: (newPassword: string) => Promise<void>;
}

const MIN_PASSWORD_LENGTH = 6;

export function PasswordResetModal({
  open,
  employeeName,
  onClose,
  onSubmit,
}: PasswordResetModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handleClose() {
    if (saving) return;
    setPassword("");
    setError(null);
    onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    setSaving(true);
    try {
      await onSubmit(password);
      setPassword("");
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No fue posible cambiar la contraseña."
      );
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Cambiar contraseña" onClose={handleClose}>
      <form className="form-grid" onSubmit={handleSubmit}>
        <p>
          Nueva contraseña para <strong>{employeeName}</strong>. Deberá volver a
          iniciar sesión con la nueva contraseña.
        </p>
        <label className="field">
          <span>Nueva contraseña</span>
          <input
            required
            type="text"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
          />
        </label>

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
            {saving ? "Guardando…" : "Cambiar contraseña"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
