import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks";
import { usePWAInstall } from "../../../../shared/hooks";
import { getFirebaseErrorMessage } from "../../../../shared/utils";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isInstallable, promptInstall } = usePWAInstall();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (submitError) {
      setError(
        getFirebaseErrorMessage(submitError, "No fue posible iniciar sesión.")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {isInstallable && (
        <div style={{ 
          position: 'sticky', 
          top: 0, 
          zIndex: 100, 
          background: 'var(--primary)', 
          color: '#fff', 
          padding: '12px 16px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          boxShadow: 'var(--shadow-sm)' 
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <strong style={{ fontSize: '0.9rem' }}>Billiard Stock</strong>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>Mejor experiencia y más rápida</span>
          </div>
          <button 
             onClick={promptInstall}
             type="button"
             style={{ 
               background: '#fff', 
               color: 'var(--primary)', 
               border: 'none', 
               borderRadius: 'var(--radius-full)', 
               padding: '6px 16px', 
               fontSize: '0.8rem', 
               fontWeight: 700, 
               cursor: 'pointer' 
             }}
          >
            Obtener
          </button>
        </div>
      )}
      <div className="auth-screen">
        <div className="auth-hero">
        <span className="page-header__eyebrow">Billiard Stock Web</span>
        <h1>Administra tu billar desde cualquier navegador</h1>
        <p>
          Controla inventario, ventas, clientes, deudas, mesas y reportes.
        </p>
      </div>

      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Iniciar sesión</h2>
        <p>Entra a tu operación diaria con una vista web rápida y limpia.</p>

        <label className="field" htmlFor="login-email">
          <span>Correo</span>
          <input
            id="login-email"
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="negocio@billar.com"
            autoComplete="email"
          />
        </label>

        <label className="field" htmlFor="login-password">
          <span>Contraseña</span>
          <input
            id="login-password"
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Tu contraseña"
            autoComplete="current-password"
          />
        </label>

        {error && <div className="alert alert--error">{error}</div>}

        <button
          className="button button--primary button--full"
          disabled={loading}
          type="submit"
        >
          {loading && <span className="button__spinner" />}
          {loading ? "Ingresando…" : "Entrar al panel"}
        </button>

        <div className="auth-links">
          <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
          <Link to="/register">Crear cuenta</Link>
        </div>
      </form>
    </div>
    </>
  );
}
