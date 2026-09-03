import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks";
import { AuthHero, PasswordField } from "../components";
import { usePWAInstall } from "../../../../shared/hooks";
import { APP_BRAND_NAME } from "../../../../shared/constants";
import { getFirebaseErrorMessage } from "../../../../shared/utils";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isInstallable, promptInstall } = usePWAInstall();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password, rememberMe);
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
            <strong style={{ fontSize: '0.9rem' }}>{APP_BRAND_NAME}</strong>
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
        <AuthHero
          title="Administra tu negocio desde cualquier navegador"
          description="Controla inventario, ventas, clientes, deudas y reportes desde un solo panel."
          features={[
            "Inventario y ventas en tiempo real",
            "Clientes, deudas y pagos al día",
            "Reportes claros del negocio cada día",
          ]}
        />

      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-card__head">
          <h2>Iniciar sesión</h2>
          <p>Entra a tu operación diaria con una vista web rápida y limpia.</p>
        </div>

        <label className="field" htmlFor="login-email">
          <span>Correo</span>
          <input
            id="login-email"
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu@negocio.com"
            autoComplete="email"
          />
        </label>

        <PasswordField
          id="login-password"
          label="Contraseña"
          required
          value={password}
          onChange={setPassword}
          placeholder="Tu contraseña"
          autoComplete="current-password"
        />

        <label className="toggle" htmlFor="login-remember">
          <input
            id="login-remember"
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
          />
          <span>Recuérdame en este dispositivo</span>
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
          <Link to="/staff-login">Soy empleado</Link>
        </div>
      </form>
    </div>
    </>
  );
}
