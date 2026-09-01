import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CountrySelect,
  MarketSelect,
  PageHeader,
  Panel,
  PrinterFormatSelect,
  ScannerModeSelect,
} from "../../../../shared/components";
import { DEFAULT_MARKET_ID, getCountryOption, getMarketOption } from "../../../../shared/constants";
import { useAuth, usePrinterFormat, useScannerMode, useToast } from "../../../../shared/hooks";
import { getFirebaseErrorMessage } from "../../../../shared/utils";

export function SettingsPage() {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const { scannerMode, setScannerMode } = useScannerMode();
  const { printerFormat, setPrinterFormat } = usePrinterFormat();

  const savedCountry = profile?.country ?? "CO";
  const savedMarket = profile?.market ?? DEFAULT_MARKET_ID;
  const [country, setCountry] = useState(savedCountry);
  const [market, setMarket] = useState(savedMarket);
  const [savingRegion, setSavingRegion] = useState(false);
  const [savingMarket, setSavingMarket] = useState(false);

  // Sincroniza los selectores cuando llega/cambia el perfil en tiempo real
  useEffect(() => {
    setCountry(savedCountry);
  }, [savedCountry]);

  useEffect(() => {
    setMarket(savedMarket);
  }, [savedMarket]);

  const preview = useMemo(() => {
    const { locale, currency } = getCountryOption(country);
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency
    }).format(12345.6);
  }, [country]);

  const marketPreview = useMemo(
    () => getMarketOption(market).description,
    [market]
  );

  const regionChanged = country !== savedCountry;
  const marketChanged = market !== savedMarket;

  async function saveRegion(event: FormEvent) {
    event.preventDefault();
    if (!regionChanged) return;

    setSavingRegion(true);
    try {
      await updateProfile({ country });
      toast("success", "Configuración regional actualizada.");
    } catch (error) {
      toast(
        "error",
        getFirebaseErrorMessage(error, "No fue posible guardar los cambios.")
      );
    } finally {
      setSavingRegion(false);
    }
  }

  async function saveMarket(event: FormEvent) {
    event.preventDefault();
    if (!marketChanged) return;

    setSavingMarket(true);
    try {
      await updateProfile({ market });
      toast("success", "Tipo de negocio actualizado.");
    } catch (error) {
      toast(
        "error",
        getFirebaseErrorMessage(error, "No fue posible guardar los cambios.")
      );
    } finally {
      setSavingMarket(false);
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Ajustes"
        title="Configuración"
        description="Ajusta tu país y el tipo de negocio. La app se adapta automáticamente."
      />

      <Panel title="Tipo de negocio">
        <form className="form-grid" onSubmit={saveMarket}>
          <MarketSelect
            id="settings-market"
            label="Tipo de negocio"
            required
            value={market}
            onChange={setMarket}
            showHint={false}
          />

          <label className="field">
            <span>Vista previa</span>
            <input type="text" value={marketPreview} readOnly tabIndex={-1} />
          </label>

          <button
            className="button button--primary"
            disabled={savingMarket || !marketChanged}
            type="submit"
          >
            {savingMarket && <span className="button__spinner" />}
            {savingMarket ? "Guardando…" : "Guardar cambios"}
          </button>
        </form>
      </Panel>

      <Panel title="País y moneda">
        <form className="form-grid" onSubmit={saveRegion}>
          <CountrySelect
            id="settings-country"
            label="País"
            required
            value={country}
            onChange={setCountry}
          />

          <label className="field">
            <span>Vista previa</span>
            <input type="text" value={preview} readOnly tabIndex={-1} />
          </label>

          <button
            className="button button--primary"
            disabled={savingRegion || !regionChanged}
            type="submit"
          >
            {savingRegion && <span className="button__spinner" />}
            {savingRegion ? "Guardando…" : "Guardar cambios"}
          </button>
        </form>
      </Panel>

      <Panel title="Lector de código de barras">
        <div className="form-grid">
          <ScannerModeSelect
            id="settings-scanner-mode"
            label="Modo de lectura"
            value={scannerMode}
            onChange={setScannerMode}
          />

          <p className="field__hint" style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
            Esta preferencia se guarda solo en este dispositivo, no se sincroniza con tu cuenta.
          </p>
        </div>
      </Panel>

      <Panel title="Impresora de facturas">
        <div className="form-grid">
          <PrinterFormatSelect
            id="settings-printer-format"
            label="Formato de papel"
            value={printerFormat}
            onChange={setPrinterFormat}
          />

          <p className="field__hint" style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
            Al imprimir se abre el diálogo del sistema, así que sirve con cualquier impresora
            (térmica, láser o de tinta, de cualquier marca). Esta preferencia se guarda solo en
            este dispositivo, no se sincroniza con tu cuenta.
          </p>
        </div>
      </Panel>
    </div>
  );
}
