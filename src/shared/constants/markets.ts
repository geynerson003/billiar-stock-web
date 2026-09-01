/**
 * Catálogo de mercados (tipos de negocio) soportados por la plataforma.
 * El perfil del usuario guarda solo `market` (el `id`); la terminología y la
 * visibilidad de secciones se resuelven en runtime desde este catálogo
 * (ver `src/shared/hooks/use-market.ts` y `src/components/layout/AppShell.tsx`).
 *
 * Importante: NO cambia la forma de los datos en Firestore. La adaptación por
 * mercado vive solo en la capa de presentación, para mantener compatibilidad
 * con la app Android hermana.
 */

export type MarketId = "billiards" | "bar" | "restaurant" | "store";

export interface MarketTerms {
  /** Label del ítem de menú de la sección de mesas. */
  tablesNav: string;
  /** Eyebrow del encabezado de la página de mesas. */
  tablesEyebrow: string;
  /** Título de la página de mesas. */
  tablesTitle: string;
  /** Descripción de la página de mesas. */
  tablesDescription: string;
  /** Botón para crear una mesa. */
  newTableCta: string;
  /** Título del panel con el listado de mesas. */
  tablesListTitle: string;
  /** Estado vacío del listado de mesas. */
  tablesEmpty: string;
  /** Sustantivo de la "sesión de cobro" de una mesa: "partida" | "cuenta". */
  sessionNoun: string;
  /** CTA para abrir la sesión activa de una mesa. */
  openSessionCta: string;
  /** CTA para iniciar una nueva sesión de mesa. */
  startSessionCta: string;
  /** Sufijo del precio de la mesa: "por partida" | "por cuenta". */
  perSessionLabel: string;
  /** Label del precio en el formulario de mesa. */
  tablePriceLabel: string;
  /** Eyebrow de la sala de mesa (GameRoomPage). */
  roomEyebrow: string;
  /** Descripción de la sala de mesa cuando no hay sesión activa. */
  roomEmptyDescription: string;
  /** CTA para iniciar la sesión dentro de la sala. */
  roomStartCta: string;
  /** Título del acceso rápido del dashboard. */
  dashboardTablesTitle: string;
  /** Subtítulo del acceso rápido del dashboard. */
  dashboardTablesSubtitle: string;
  /** Título del panel "ventas por mesa" en reportes. */
  reportsByTableTitle: string;
  /** Estado vacío del panel "ventas por mesa". */
  reportsByTableEmpty: string;
  /** Opción "Por mesa" en el selector de tipo de venta. */
  salesTableOption: string;
  /** Título del hero de las pantallas de auth. */
  authHeroTitle: string;
  /** Descripción del hero de las pantallas de auth. */
  authHeroDescription: string;
}

export interface MarketOption {
  id: MarketId;
  /** Nombre para el selector, ej. "Billar". */
  name: string;
  /** Ayuda corta mostrada bajo el selector. */
  description: string;
  /** Subtítulo de marca en el sidebar. */
  brandTagline: string;
  features: {
    /** Muestra la sección de mesas / partidas / cuentas. */
    tables: boolean;
  };
  terms: MarketTerms;
}

/** Nombre neutro de la aplicación (rebrand multi-mercado). */
export const APP_BRAND_NAME = "Mi Negocio";

/**
 * Para `billiards` los términos son idénticos a los textos que ya estaban
 * hardcodeados, de modo que ese mercado no tiene ningún cambio visible.
 */
export const MARKETS: MarketOption[] = [
  {
    id: "billiards",
    name: "Billar",
    description: "Mesas de billar con partidas, apuestas y perdedores.",
    brandTagline: "Control total del negocio",
    features: { tables: true },
    terms: {
      tablesNav: "Mesas",
      tablesEyebrow: "Mesas",
      tablesTitle: "Gestión de mesas",
      tablesDescription: "Gestiona tus mesas y abre partidas.",
      newTableCta: "Nueva mesa",
      tablesListTitle: "Mesas configuradas",
      tablesEmpty:
        "Todavía no hay mesas creadas. Registra la primera para abrir partidas.",
      sessionNoun: "partida",
      openSessionCta: "Abrir partida",
      startSessionCta: "Iniciar sesión",
      perSessionLabel: "por partida",
      tablePriceLabel: "Precio por partida",
      roomEyebrow: "Partida",
      roomEmptyDescription:
        "Crea una partida y administra participantes, apuestas y perdedores.",
      roomStartCta: "Iniciar partida",
      dashboardTablesTitle: "Mesas y partidas",
      dashboardTablesSubtitle: "Juegos, participantes y apuestas.",
      reportsByTableTitle: "Ventas por mesa",
      reportsByTableEmpty: "No hay ventas por mesa para el periodo seleccionado.",
      salesTableOption: "Por mesa",
      authHeroTitle: "Lleva el control operativo de tu billar",
      authHeroDescription:
        "Todo lo que necesitas para gestionar tu negocio de billar en un solo lugar.",
    },
  },
  {
    id: "bar",
    name: "Bar",
    description: "Mesas con cuenta de consumo: se cobra al cerrar la mesa.",
    brandTagline: "Control total de tu bar",
    features: { tables: true },
    terms: {
      tablesNav: "Mesas",
      tablesEyebrow: "Mesas",
      tablesTitle: "Gestión de mesas",
      tablesDescription: "Gestiona tus mesas y abre cuentas de consumo.",
      newTableCta: "Nueva mesa",
      tablesListTitle: "Mesas configuradas",
      tablesEmpty:
        "Todavía no hay mesas creadas. Registra la primera para abrir cuentas.",
      sessionNoun: "cuenta",
      openSessionCta: "Abrir cuenta",
      startSessionCta: "Abrir mesa",
      perSessionLabel: "por consumo",
      tablePriceLabel: "Cargo base de la mesa",
      roomEyebrow: "Cuenta",
      roomEmptyDescription:
        "Abre la cuenta de la mesa y registra el consumo de los comensales.",
      roomStartCta: "Abrir cuenta",
      dashboardTablesTitle: "Mesas y cuentas",
      dashboardTablesSubtitle: "Consumo por mesa y cierre de cuentas.",
      reportsByTableTitle: "Ventas por mesa",
      reportsByTableEmpty: "No hay ventas por mesa para el periodo seleccionado.",
      salesTableOption: "Por mesa",
      authHeroTitle: "Lleva el control operativo de tu bar",
      authHeroDescription:
        "Todo lo que necesitas para gestionar tu bar en un solo lugar.",
    },
  },
  {
    id: "restaurant",
    name: "Restaurante",
    description: "Mesas con cuenta por comensales: se cobra al cerrar la mesa.",
    brandTagline: "Control total de tu restaurante",
    features: { tables: true },
    terms: {
      tablesNav: "Mesas",
      tablesEyebrow: "Mesas",
      tablesTitle: "Gestión de mesas",
      tablesDescription: "Gestiona tus mesas y abre cuentas por mesa.",
      newTableCta: "Nueva mesa",
      tablesListTitle: "Mesas configuradas",
      tablesEmpty:
        "Todavía no hay mesas creadas. Registra la primera para abrir cuentas.",
      sessionNoun: "cuenta",
      openSessionCta: "Abrir cuenta",
      startSessionCta: "Abrir mesa",
      perSessionLabel: "por consumo",
      tablePriceLabel: "Cargo base de la mesa",
      roomEyebrow: "Cuenta",
      roomEmptyDescription:
        "Abre la cuenta de la mesa y registra el pedido de los comensales.",
      roomStartCta: "Abrir cuenta",
      dashboardTablesTitle: "Mesas y cuentas",
      dashboardTablesSubtitle: "Consumo por mesa y cierre de cuentas.",
      reportsByTableTitle: "Ventas por mesa",
      reportsByTableEmpty: "No hay ventas por mesa para el periodo seleccionado.",
      salesTableOption: "Por mesa",
      authHeroTitle: "Lleva el control operativo de tu restaurante",
      authHeroDescription:
        "Todo lo que necesitas para gestionar tu restaurante en un solo lugar.",
    },
  },
  {
    id: "store",
    name: "Tienda / Minimercado",
    description: "Inventario, ventas, fiado, gastos y reportes. Sin mesas.",
    brandTagline: "Control total de tu tienda",
    features: { tables: false },
    terms: {
      // Estos términos no se muestran (la sección de mesas está oculta), pero
      // se rellenan para mantener el tipo completo.
      tablesNav: "Mesas",
      tablesEyebrow: "Mesas",
      tablesTitle: "Gestión de mesas",
      tablesDescription: "",
      newTableCta: "Nueva mesa",
      tablesListTitle: "Mesas configuradas",
      tablesEmpty: "",
      sessionNoun: "cuenta",
      openSessionCta: "Abrir cuenta",
      startSessionCta: "Abrir mesa",
      perSessionLabel: "",
      tablePriceLabel: "Precio",
      roomEyebrow: "Cuenta",
      roomEmptyDescription: "",
      roomStartCta: "Abrir cuenta",
      dashboardTablesTitle: "Mesas",
      dashboardTablesSubtitle: "",
      reportsByTableTitle: "Ventas por mesa",
      reportsByTableEmpty: "No hay ventas por mesa para el periodo seleccionado.",
      salesTableOption: "Por mesa",
      authHeroTitle: "Lleva el control operativo de tu tienda",
      authHeroDescription:
        "Todo lo que necesitas para gestionar tu tienda o minimercado en un solo lugar.",
    },
  },
];

/** Fallback de render mientras no hay mercado seleccionado. */
export const DEFAULT_MARKET_ID: MarketId = "store";

const MARKET_BY_ID = new Map(MARKETS.map((market) => [market.id, market]));

/**
 * Devuelve la configuración del mercado indicado. Si el id es nulo o
 * desconocido, cae al mercado por defecto (solo para render seguro; el gate de
 * onboarding se encarga de pedir el mercado real).
 */
export function getMarketOption(id?: string | null): MarketOption {
  return (
    (id ? MARKET_BY_ID.get(id as MarketId) : undefined) ??
    MARKET_BY_ID.get(DEFAULT_MARKET_ID)!
  );
}

/** True si `id` corresponde a un mercado conocido. */
export function isKnownMarket(id?: string | null): id is MarketId {
  return !!id && MARKET_BY_ID.has(id as MarketId);
}
