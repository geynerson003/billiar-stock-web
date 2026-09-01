import { useState, type FormEvent } from "react";
import { MarketSelect } from "../../../../shared/components";
import { DEFAULT_MARKET_ID } from "../../../../shared/constants";
import { useAuth, useToast } from "../../../../shared/hooks";
import { getFirebaseErrorMessage } from "../../../../shared/utils";

/**
 * Gate de onboarding para cuentas sin `market` (perfiles creados antes de la
 * plataforma multi-mercado). Se muestra a pantalla completa en lugar de la app
 * hasta que el usuario elige su tipo de negocio.
 */
export function SelectMarketPage() {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [market, setMarket] = useState<string>(DEFAULT_MARKET_ID);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ market });
      // El gate de ProtectedRoute deja pasar en cuanto el perfil se actualiza.
    } catch (error) {
      toast(
        "error",
        getFirebaseErrorMessage(error, "No fue posible guardar tu selección.")
      );
      setSaving(false);
    }
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-card__head">
          <h2>Configura tu negocio</h2>
          <p>
            {profile?.businessName
              ? `Cuéntanos qué tipo de negocio es "${profile.businessName}". `
              : "Cuéntanos qué tipo de negocio tienes. "}
            La app se adapta a lo que elijas.
          </p>
        </div>

        <MarketSelect
          id="onboarding-market"
          label="Tipo de negocio"
          required
          value={market}
          onChange={setMarket}
        />

        <button
          className="button button--primary button--full"
          disabled={saving}
          type="submit"
        >
          {saving && <span className="button__spinner" />}
          {saving ? "Guardando…" : "Continuar"}
        </button>
      </form>
    </div>
  );
}
