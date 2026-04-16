export type SaleType = "TABLE" | "EXTERNAL";
export type PaymentMethod = "CASH" | "CARD" | "TRANSFER" | "OTHER";
export type GameStatus = "ACTIVE" | "FINISHED" | "CANCELLED";
export type ReportType = "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM";

export interface UserProfile {
  uid: string;
  email: string;
  businessName: string;
  createdAt: number;
  isActive: boolean;
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
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

export interface TableEntity {
  id: string;
  name: string;
  pricePerGame: number;
  currentSessionId?: string | null;
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
