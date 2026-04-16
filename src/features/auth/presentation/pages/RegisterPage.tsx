import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks";
import { getFirebaseErrorMessage } from "../../../../shared/utils";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      await register(email, password, businessName);
      navigate("/");
    } catch (submitError) {
      setError(
        getFirebaseErrorMessage(submitError, "No fue posible crear la cuenta.")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-hero">
        <span className="page-header__eyebrow">Alta de negocio</span>
        <h1>Lleva tu control operativo</h1>
        <p>
          Todo lo que necesitas para llevar el control de tu billar en un solo lugar.
        </p>
      </div>

      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Crear cuenta</h2>
        <p>Registra tu negocio y empieza a llevar el control de tu billar</p>

        <label className="field" htmlFor="reg-business">
          <span>Nombre del negocio</span>
          <input
            id="reg-business"
            required
            type="text"
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            placeholder="Billar Central"
            autoComplete="organization"
          />
        </label>

        <label className="field" htmlFor="reg-email">
          <span>Correo</span>
          <input
            id="reg-email"
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="negocio@billar.com"
            autoComplete="email"
          />
        </label>

        <label className="field" htmlFor="reg-password">
          <span>Contraseña</span>
          <input
            id="reg-password"
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
          />
        </label>

        <label className="field" htmlFor="reg-confirm">
          <span>Confirmar contraseña</span>
          <input
            id="reg-confirm"
            required
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repite tu contraseña"
            autoComplete="new-password"
          />
        </label>

        {error && <div className="alert alert--error">{error}</div>}

        <button
          className="button button--primary button--full"
          disabled={loading}
          type="submit"
        >
          {loading && <span className="button__spinner" />}
          {loading ? "Creando…" : "Crear cuenta"}
        </button>

        <div className="auth-links">
          <Link to="/login">Volver al login</Link>
        </div>
      </form>
    </div>
  );
}
