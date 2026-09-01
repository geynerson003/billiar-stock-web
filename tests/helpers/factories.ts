import type {
  Client,
  Expense,
  Game,
  GameBet,
  GameParticipant,
  Payment,
  Product,
  Sale,
  SaleItem,
  TableEntity,
  TableSession,
} from "../../src/shared/types/models";

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    name: "Producto",
    stock: 100,
    supplierPrice: 10,
    salePrice: 20,
    minStock: 5,
    saleBasketPrice: null,
    unitsPerPackage: 1,
    barcode: null,
    ...overrides,
  };
}

export function makeSaleItem(overrides: Partial<SaleItem> = {}): SaleItem {
  return {
    productId: "p1",
    productName: "Producto",
    quantity: 1,
    unitPrice: 20,
    totalPrice: 20,
    saleByBasket: false,
    ...overrides,
  };
}

export function makeSale(overrides: Partial<Sale> = {}): Sale {
  return {
    id: "s1",
    items: [],
    totalAmount: 0,
    profit: 0,
    date: Date.parse("2026-01-15T12:00:00Z"),
    tableId: null,
    type: "EXTERNAL",
    sellerId: "owner",
    clientId: "",
    isPaid: true,
    isGameSale: false,
    gameId: null,
    productId: "",
    productName: "",
    quantity: 0,
    price: 0,
    ...overrides,
  };
}

export function makeClient(overrides: Partial<Client> = {}): Client {
  return {
    id: "c1",
    nombre: "Cliente",
    telefono: "",
    deuda: 0,
    deudaOriginal: 0,
    totalPagado: 0,
    ...overrides,
  };
}

export function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: "pay1",
    clientId: "c1",
    amount: 0,
    date: Date.parse("2026-01-15T12:00:00Z"),
    description: "",
    paymentMethod: "CASH",
    relatedSales: [],
    isPartialPayment: true,
    notes: "",
    ...overrides,
  };
}

export function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: "e1",
    description: "Gasto",
    amount: 0,
    category: "General",
    date: String(Date.parse("2026-01-15T12:00:00Z")),
    ...overrides,
  };
}

export function makeTable(overrides: Partial<TableEntity> = {}): TableEntity {
  return {
    id: "t1",
    name: "Mesa 1",
    pricePerGame: 0,
    currentSessionId: null,
    pricingMode: "GAME",
    timerDurationMinutes: 0,
    ...overrides,
  };
}

export function makeSession(overrides: Partial<TableSession> = {}): TableSession {
  return {
    id: "sess1",
    tableId: "t1",
    startTime: Date.parse("2026-01-15T12:00:00Z"),
    endTime: null,
    sales: [],
    total: 0,
    ...overrides,
  };
}

export function makeParticipant(
  overrides: Partial<GameParticipant> = {}
): GameParticipant {
  return {
    clientId: "c1",
    clientName: "Cliente",
    joinedAt: Date.parse("2026-01-15T12:00:00Z"),
    ...overrides,
  };
}

export function makeBet(overrides: Partial<GameBet> = {}): GameBet {
  return {
    productId: "p1",
    productName: "Producto",
    quantity: 1,
    unitPrice: 20,
    totalPrice: 20,
    betByClientIds: [],
    ...overrides,
  };
}

export function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: "g1",
    tableId: "t1",
    sessionId: "sess1",
    startTime: Date.parse("2026-01-15T12:00:00Z"),
    endTime: null,
    pricePerGame: 0,
    participants: [],
    bets: [],
    loserIds: [],
    amountPerLoser: 0,
    isPaid: false,
    status: "ACTIVE",
    totalAmount: 0,
    pricingMode: "GAME",
    timerDurationMs: null,
    ...overrides,
  };
}

/** Fake de un QueryDocumentSnapshot de Firestore para probar los mappers. */
export function fakeSnapshot(id: string, data: Record<string, unknown>) {
  return {
    id,
    data: () => data,
    exists: () => true,
  } as unknown as import("firebase/firestore").QueryDocumentSnapshot<
    import("firebase/firestore").DocumentData
  >;
}
