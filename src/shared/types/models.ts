export type SaleType = "TABLE" | "EXTERNAL";
export type PaymentMethod = "CASH" | "CARD" | "TRANSFER" | "OTHER";
export type GameStatus = "ACTIVE" | "FINISHED" | "CANCELLED";
export type ReportType = "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM";
/** Cómo se cobra una mesa: por partida jugada o por un bloque de tiempo con cronómetro. */
export type TablePricingMode = "GAME" | "TIME";

export interface UserProfile {
  uid: string;
  email: string;
  businessName: string;
  createdAt: number;
  isActive: boolean;
  /** Código ISO-3166 alpha-2 del país. Determina moneda y locale. */
  country: string;
  /**
   * Tipo de negocio elegido en el registro (ver `src/shared/constants/markets.ts`).
   * Determina terminología y qué secciones se muestran. Opcional: los perfiles
   * antiguos no lo tienen y se les pide en un gate de onboarding.
   */
  market?: string;
  /**
   * Rol dentro del negocio. Ausente ⇒ administrador/dueño (compatibilidad con
   * cuentas anteriores a multiusuario). Ver `src/shared/constants/permissions.ts`.
   */
  role?: "admin" | "employee";
  /** Solo empleados: uid del dueño del negocio (= businessId efectivo). */
  ownerUid?: string;
  /**
   * Solo empleados: id estable del empleado dentro del negocio. Se usa como
   * `sellerId`/autoría y NO cambia al resetear la contraseña.
   */
  employeeId?: string;
  /** Solo empleados: nombre de usuario para iniciar sesión, tal cual lo escribió el admin. */
  loginName?: string;
  /**
   * Solo empleados: `loginName` normalizado (minúsculas, sin acentos,
   * `[^a-z0-9]+` → `-`). Único por negocio.
   */
  loginNameSlug?: string;
  /** Solo empleados: nombre visible en el panel del admin. */
  displayName?: string;
  /** Solo empleados: permisos concedidos (ids de `Permission`). */
  permissions?: string[];
  /** Solo empleados: preset de rol aplicado (`vendedor` | `encargado` | `custom`). Metadato de UI. */
  rolePreset?: string;
  /** Solo empleados: versión de credencial. Se incrementa en cada reseteo de contraseña. */
  credV?: number;
  /** Solo empleados: email sintético con el que se autentican en Firebase Auth. */
  syntheticEmail?: string;
}

/**
 * Documento de empleado bajo `businesses/{ownerUid}/employees/{employeeId}`.
 * Fuente de verdad para el panel de administración; `users/{authUid}` es el
 * espejo que lee el propio empleado en runtime.
 */
export interface EmployeeDoc {
  id: string;
  loginName: string;
  loginNameSlug: string;
  displayName: string;
  permissions: string[];
  rolePreset: string;
  isActive: boolean;
  credV: number;
  /** uid de Firebase Auth vigente del empleado (rota al resetear la contraseña). */
  currentAuthUid: string;
  syntheticEmail: string;
  createdAt: number;
  createdBy: string;
  updatedAt: number;
}

export interface Product {
  id: string;
  name: string;
  stock: number;
  supplierPrice: number;
  salePrice: number;
  minStock: number;
  saleBasketPrice?: number | null;
  unitsPerPackage: number;
  /** Código de barras del producto (EAN, UPC, Code128, etc.), si se registró. */
  barcode?: string | null;
}

export interface Client {
  id: string;
  nombre: string;
  telefono: string;
  deuda: number;
  deudaOriginal: number;
  totalPagado: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  saleByBasket: boolean;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  totalAmount: number;
  profit: number;
  date: number;
  tableId?: string | null;
  type: SaleType;
  sellerId: string;
  clientId: string;
  isPaid: boolean;
  isGameSale: boolean;
  gameId?: string | null;
  productId?: string;
  productName?: string;
  quantity?: number;
  price?: number;
}

export interface Payment {
  id: string;
  clientId: string;
  amount: number;
  date: number;
  description: string;
  paymentMethod: PaymentMethod;
  relatedSales: string[];
  isPartialPayment: boolean;
  notes: string;
  /** Autoría: id del actor que registró el cobro (`employeeId` o uid del dueño). */
  registeredBy?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  /** Autoría: id del actor que registró el gasto (`employeeId` o uid del dueño). Se fija solo al crear. */
  createdBy?: string;
}

export interface TableEntity {
  id: string;
  name: string;
  pricePerGame: number;
  currentSessionId?: string | null;
  /** Forma de cobro de la mesa. Por defecto "GAME" (compatibilidad con mesas existentes). */
  pricingMode?: TablePricingMode;
  /** Duración del cronómetro en minutos, solo aplica cuando pricingMode es "TIME". */
  timerDurationMinutes?: number;
}

export interface TableSession {
  id: string;
  tableId: string;
  startTime: number;
  endTime?: number | null;
  sales: string[];
  total: number;
}

export interface GameParticipant {
  clientId: string;
  clientName: string;
  joinedAt: number;
}

export interface GameBet {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  betByClientIds: string[];
}

export interface Game {
  id: string;
  tableId: string;
  sessionId: string;
  startTime: number;
  endTime?: number | null;
  pricePerGame: number;
  participants: GameParticipant[];
  bets: GameBet[];
  loserIds: string[];
  amountPerLoser: number;
  isPaid: boolean;
  status: GameStatus;
  totalAmount: number;
  /** Copia de TableEntity.pricingMode al momento de iniciar la partida. */
  pricingMode?: TablePricingMode;
  /** Copia de TableEntity.timerDurationMinutes (en ms) al iniciar, para el cronómetro de esta partida. */
  timerDurationMs?: number | null;
}

export interface ClientDebtInfo {
  clientId: string;
  totalDebt: number;
  totalPaid: number;
  remainingDebt: number;
  pendingSales: Sale[];
  payments: Payment[];
  isFullyPaid: boolean;
}

export interface DashboardSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  totalDebt: number;
  lowStockAlerts: Product[];
  topProducts: Array<{ name: string; quantity: number }>;
  chartData: Array<{ label: string; value: number }>;
}

export interface ReportResult {
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  totalClientDebt: number;
  salesByTable: Record<string, number>;
  salesByProduct: Record<string, number>;
  topProducts: Array<{ name: string; quantity: number }>;
}

export interface ReportFilter {
  type: ReportType;
  startDate?: number;
  endDate?: number;
}
