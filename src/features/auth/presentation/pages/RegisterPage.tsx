import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks";
import { AuthHero, PasswordField } from "../components";
import { CountrySelect, MarketSelect } from "../../../../shared/components/common";
import { DEFAULT_MARKET_ID, getMarketOption } from "../../../../shared/constants";
import { getFirebaseErrorMessage } from "../../../../shared/utils";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [businessName, setBusinessName] = useState("");
  const [country, setCountry] = useState("CO");
  const [market, setMarket] = useState<string>(DEFAULT_MARKET_ID);
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
      await register(email, password, businessName, country, market);
      navigate("/");
    } catch (submitError) {
      setError(
        getFirebaseErrorMessage(submitError, "No fue posible crear la cuenta.")
      );
    } finally {
      setLoading(false);
    }
  }

  const marketTerms = getMarketOption(market).terms;

  return (
    <div className="auth-screen">
      <AuthHero
        title={marketTerms.authHeroTitle}
        description={marketTerms.authHeroDescription}
        features={[
          "Configura tu inventario en minutos",
          "Registra ventas y deudas sin fricción",
          "Consulta reportes claros cada día",
        ]}
      />

      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-card__head">
          <h2>Crear cuenta</h2>
          <p>Registra tu negocio y empieza a llevar el control de tu operación.</p>
        </div>

        <label className="field" htmlFor="reg-business">
          <span>Nombre del negocio</span>
          <input
            id="reg-business"
            required
            type="text"
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            placeholder="Ej: Bar Central"
            autoComplete="organization"
          />
        </label>

        <MarketSelect
          id="reg-market"
          label="Tipo de negocio"
          required
          value={market}
          onChange={setMarket}
        />

        <CountrySelect
          id="reg-country"
          label="País"
          required
          value={country}
          onChange={setCountry}
        />

        <label className="field" htmlFor="reg-email">
          <span>Correo</span>
          <input
            id="reg-email"
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu@negocio.com"
            autoComplete="email"
          />
        </label>

        <PasswordField
          id="reg-password"
          label="Contraseña"
          required
          value={password}
          onChange={setPassword}
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
        />

        <PasswordField
          id="reg-confirm"
          label="Confirmar contraseña"
          required
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Repite tu contraseña"
          autoComplete="new-password"
        />

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
