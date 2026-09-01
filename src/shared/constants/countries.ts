/**
 * Catálogo de países de Latinoamérica con su moneda y locale.
 * De aquí se deriva todo el formateo de moneda/fecha de la app (ver
 * `src/shared/utils/format.ts`). El perfil del usuario guarda solo `country`
 * (código ISO-3166 alpha-2); moneda y locale se resuelven en runtime.
 */

export interface CountryOption {
  /** Código ISO-3166 alpha-2, ej. "CO" */
  code: string;
  /** Nombre para mostrar, ej. "Colombia" */
  name: string;
  /** Código ISO-4217 de la moneda, ej. "COP" */
  currency: string;
  /** Locale BCP-47 para `Intl`, ej. "es-CO" */
  locale: string;
}

export const LATAM_COUNTRIES: CountryOption[] = [
  { code: "AR", name: "Argentina", currency: "ARS", locale: "es-AR" },
  { code: "BO", name: "Bolivia", currency: "BOB", locale: "es-BO" },
  { code: "BR", name: "Brasil", currency: "BRL", locale: "pt-BR" },
  { code: "CL", name: "Chile", currency: "CLP", locale: "es-CL" },
  { code: "CO", name: "Colombia", currency: "COP", locale: "es-CO" },
  { code: "CR", name: "Costa Rica", currency: "CRC", locale: "es-CR" },
  { code: "CU", name: "Cuba", currency: "CUP", locale: "es-CU" },
  { code: "DO", name: "República Dominicana", currency: "DOP", locale: "es-DO" },
  { code: "EC", name: "Ecuador", currency: "USD", locale: "es-EC" },
  { code: "SV", name: "El Salvador", currency: "USD", locale: "es-SV" },
  { code: "GT", name: "Guatemala", currency: "GTQ", locale: "es-GT" },
  { code: "HN", name: "Honduras", currency: "HNL", locale: "es-HN" },
  { code: "MX", name: "México", currency: "MXN", locale: "es-MX" },
  { code: "NI", name: "Nicaragua", currency: "NIO", locale: "es-NI" },
  { code: "PA", name: "Panamá", currency: "USD", locale: "es-PA" },
  { code: "PY", name: "Paraguay", currency: "PYG", locale: "es-PY" },
  { code: "PE", name: "Perú", currency: "PEN", locale: "es-PE" },
  { code: "PR", name: "Puerto Rico", currency: "USD", locale: "es-PR" },
  { code: "UY", name: "Uruguay", currency: "UYU", locale: "es-UY" },
  { code: "VE", name: "Venezuela", currency: "VES", locale: "es-VE" }
];

export const DEFAULT_COUNTRY_CODE = "CO";

const COUNTRY_BY_CODE = new Map(
  LATAM_COUNTRIES.map((country) => [country.code, country])
);

/**
 * Devuelve la configuración del país indicado. Si el código es nulo o
 * desconocido (perfiles antiguos sin `country`), cae a Colombia.
 */
export function getCountryOption(code?: string | null): CountryOption {
  return (
    (code ? COUNTRY_BY_CODE.get(code) : undefined) ??
    COUNTRY_BY_CODE.get(DEFAULT_COUNTRY_CODE)!
  );
}
