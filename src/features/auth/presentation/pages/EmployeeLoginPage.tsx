import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks";
import { AuthHero, PasswordField } from "../components";
import { getFirebaseErrorMessage } from "../../../../shared/utils";
import {
  EMPLOYEE_BIZ_CODE_STORAGE_KEY,
  EmployeeLoginError,
  resolveEmployeeEmail
} from "../../../employees/services/employee-login.service";

function readStoredCode(): string {
  try {
    return localStorage.getItem(EMPLOYEE_BIZ_CODE_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function EmployeeLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [businessCode, setBusinessCode] = useState("");
  const [loginName, setLoginName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBusinessCode(readStoredCode());
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const email = await resolveEmployeeEmail(businessCode, loginName);
      await login(email, password);
      try {
        localStorage.setItem(
          EMPLOYEE_BIZ_CODE_STORAGE_KEY,
          businessCode.trim().toUpperCase()
        );
      } catch {
        /* almacenamiento no disponible: no es crítico */
      }
      navigate("/");
    } catch (submitError) {
      if (submitError instanceof EmployeeLoginError) {
        setError(submitError.message);
      } else {
        setError(getFirebaseErrorMessage(submitError, "Nombre o contraseña incorrectos."));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <AuthHero
        title="Entra a tu turno"
        description="Registra ventas y cobros desde tu celular con la cuenta que te dio el administrador."
        features={[
          "Tus ventas y cobros del día",
          "Todo sincronizado con el negocio",
          "Sin instalar nada",
        ]}
      />

      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-card__head">
          <h2>Ingreso de empleados</h2>
          <p>Usa el código del negocio, tu nombre de usuario y tu contraseña.</p>
        </div>

        <label className="field" htmlFor="staff-code">
          <span>Código del negocio</span>
          <input
            id="staff-code"
            required
            value={businessCode}
            onChange={(event) => setBusinessCode(event.target.value.toUpperCase())}
            placeholder="Ej: MNK4F7"
            autoCapitalize="characters"
            autoComplete="off"
          />
        </label>

        <label className="field" htmlFor="staff-name">
          <span>Nombre de usuario</span>
          <input
            id="staff-name"
            required
            value={loginName}
            onChange={(event) => setLoginName(event.target.value)}
            placeholder="Tu nombre"
            autoComplete="username"
          />
        </label>

        <PasswordField
          id="staff-password"
          label="Contraseña"
          required
          value={password}
          onChange={setPassword}
          placeholder="Tu contraseña"
          autoComplete="current-password"
        />

        {error && <div className="alert alert--error">{error}</div>}

        <button
          className="button button--primary button--full"
          disabled={loading}
          type="submit"
        >
          {loading && <span className="button__spinner" />}
          {loading ? "Ingresando…" : "Entrar"}
        </button>

        <div className="auth-links">
          <Link to="/login">Soy el dueño</Link>
        </div>
      </form>
    </div>
  );
}
