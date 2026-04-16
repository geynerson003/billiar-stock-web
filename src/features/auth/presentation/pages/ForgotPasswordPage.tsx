import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks";
import { getFirebaseErrorMessage } from "../../../../shared/utils";

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      await resetPassword(email);
      setMessage("Te enviamos un correo para restablecer la contraseña.");
    } catch (submitError) {
      setError(
        getFirebaseErrorMessage(submitError, "No fue posible enviar el correo.")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen auth-screen--centered">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Recuperar contraseña</h2>
        <p>Ingresa tu correo y te enviaremos un enlace para restablecer la contraseña.</p>

        <label className="field" htmlFor="forgot-email">
          <span>Correo</span>
          <input
            id="forgot-email"
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="negocio@billar.com"
            autoComplete="email"
          />
        </label>

        {message && <div className="alert alert--success">{message}</div>}
        {error && <div className="alert alert--error">{error}</div>}

        <button
          className="button button--primary button--full"
          disabled={loading}
          type="submit"
        >
          {loading && <span className="button__spinner" />}
          {loading ? "Enviando…" : "Enviar enlace"}
        </button>

        <div className="auth-links">
          <Link to="/login">Volver al inicio de sesión</Link>
        </div>
      </form>
    </div>
  );
}
