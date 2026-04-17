import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  type CollectionReference,
  type DocumentData,
  type DocumentSnapshot,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type Unsubscribe
} from "firebase/firestore";
import { db } from "./config";
import {
  calculatePendingDebt,
  calculateSupplierPricePerUnit,
  getSaleAmount,
  prepareGameSales
} from "../../utils/financial";
import type {
  Client,
  Expense,
  Game,
  GameBet,
  GameParticipant,
  Payment,
  Product,
  Sale,
  TableEntity,
  TableSession,
  UserProfile
} from "../../types/models";

function toMillis(value: unknown, fallback = Date.now()): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  if (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof (value as { toMillis: () => number }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return fallback;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return fallback;
}

function toText(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function toNullableText(value: unknown): string | null {
  const text = toText(value).trim();
  return text.length > 0 ? text : null;
}

function mapDoc<T>(
  snapshot: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>,
  defaults: T
): T & { id: string } {
  return {
    ...defaults,
    ...(snapshot.data() ?? {}),
    id: snapshot.id
  } as T & { id: string };
}

export const defaultUserProfile: UserProfile = {
  uid: "",
  email: "",
  businessName: "",
  createdAt: Date.now(),
  isActive: true
};

export const defaultProduct: Product = {
  id: "",
  name: "",
  stock: 0,
  supplierPrice: 0,
  salePrice: 0,
  minStock: 0,
  saleBasketPrice: null,
  unitsPerPackage: 1
};

export const defaultClient: Client = {
  id: "",
  nombre: "",
  telefono: "",
  deuda: 0,
  deudaOriginal: 0,
  totalPagado: 0
};

export const defaultExpense: Expense = {
  id: "",
  description: "",
  amount: 0,
  category: "General",
  date: String(Date.now())
};

export const defaultPayment: Payment = {
  id: "",
  clientId: "",
  amount: 0,
  date: Date.now(),
  description: "",
  paymentMethod: "CASH",
  relatedSales: [],
  isPartialPayment: true,
  notes: ""
};

export const defaultTable: TableEntity = {
  id: "",
  name: "",
  pricePerGame: 0,
  currentSessionId: null
};

export const defaultSession: TableSession = {
  id: "",
  tableId: "",
  startTime: Date.now(),
  endTime: null,
  sales: [],
  total: 0
};

export const defaultSale: Sale = {
  id: "",
  items: [],
  totalAmount: 0,
  profit: 0,
  date: Date.now(),
  tableId: null,
  type: "EXTERNAL",
  sellerId: "",
  clientId: "",
  isPaid: false,
  isGameSale: false,
  gameId: null,
  productId: "",
  productName: "",
  quantity: 0,
  price: 0
};

export const defaultGame: Game = {
  id: "",
  tableId: "",
  sessionId: "",
  startTime: Date.now(),
  endTime: null,
  pricePerGame: 0,
  participants: [],
  bets: [],
  loserIds: [],
  amountPerLoser: 0,
  isPaid: false,
  status: "ACTIVE",
  totalAmount: 0
};

export function businessCollection<T = DocumentData>(
  userId: string,
  collectionName: string
): CollectionReference<T> {
  return collection(
    db,
    "businesses",
    userId,
    collectionName
  ) as CollectionReference<T>;
}

export function watchUserProfile(
  userId: string,
  onData: (profile: UserProfile | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, "users", userId), (snapshot) => {
    if (!snapshot.exists()) {
      onData(null);
      return;
    }

    const data = mapDoc(snapshot, defaultUserProfile);
    onData({
      ...data,
      createdAt: toMillis(data.createdAt)
    });
  });
}

export function mapProduct(snapshot: QueryDocumentSnapshot<DocumentData>): Product {
  const data = mapDoc(snapshot, defaultProduct);
  return {
    ...data,
    stock: toNumber(data.stock),
    supplierPrice: toNumber(data.supplierPrice),
    salePrice: toNumber(data.salePrice),
    minStock: toNumber(data.minStock),
    unitsPerPackage: Math.max(toNumber(data.unitsPerPackage, 1), 1),
    saleBasketPrice:
      data.saleBasketPrice === undefined || data.saleBasketPrice === null
        ? null
        : toNumber(data.saleBasketPrice)
  };
}

export function mapClient(snapshot: QueryDocumentSnapshot<DocumentData>): Client {
  const data = mapDoc(snapshot, defaultClient);
  return {
    ...data,
    deuda: toNumber(data.deuda),
    deudaOriginal: toNumber(data.deudaOriginal),
    totalPagado: toNumber(data.totalPagado)
  };
}

export function mapExpense(snapshot: QueryDocumentSnapshot<DocumentData>): Expense {
  const data = mapDoc(snapshot, defaultExpense);
  return {
    ...data,
    amount: toNumber(data.amount),
    date: String(data.date ?? Date.now())
  };
}

export function mapPayment(snapshot: QueryDocumentSnapshot<DocumentData>): Payment {
  const data = mapDoc(snapshot, defaultPayment);
  return {
    ...data,
    amount: toNumber(data.amount),
    date: toMillis(data.date)
  };
}

export function mapTable(snapshot: QueryDocumentSnapshot<DocumentData>): TableEntity {
  const data = mapDoc(snapshot, defaultTable);
  return {
    ...data,
    pricePerGame: toNumber(data.pricePerGame),
    currentSessionId: toNullableText(data.currentSessionId)
  };
}

export function mapTableSession(
  snapshot: QueryDocumentSnapshot<DocumentData>
): TableSession {
  const data = mapDoc(snapshot, defaultSession);
  return {
    ...data,
    startTime: toMillis(data.startTime),
    endTime: data.endTime ? toMillis(data.endTime) : null,
    sales: Array.isArray(data.sales) ? data.sales.map((saleId) => toText(saleId)) : [],
    total: toNumber(data.total)
  };
}

export function mapSale(snapshot: QueryDocumentSnapshot<DocumentData>): Sale {
  const data = mapDoc(snapshot, defaultSale);
  const legacyPaidFlag = (data as Sale & { paid?: boolean; Paid?: boolean }).paid;
  return {
    ...data,
    date: toMillis(data.date),
    totalAmount: toNumber(data.totalAmount),
    profit: toNumber(data.profit),
    tableId: toNullableText(data.tableId),
    type: data.type === "TABLE" ? "TABLE" : "EXTERNAL",
    sellerId: toText(data.sellerId),
    clientId: toText(data.clientId),
    quantity: toNumber(data.quantity),
    price: toNumber(data.price),
    isPaid: toBoolean(
      data.isPaid ??
        legacyPaidFlag ??
        (data as Sale & { paid?: boolean; Paid?: boolean }).Paid ??
        false
    ),
    isGameSale: toBoolean(data.isGameSale),
    gameId: toNullableText(data.gameId),
    productId: toText(data.productId),
    productName: toText(data.productName),
    items: Array.isArray(data.items)
      ? data.items.map((item) => ({
          productId: toText(item?.productId),
          productName: toText(item?.productName),
          quantity: toNumber(item?.quantity),
          unitPrice: toNumber(item?.unitPrice),
          totalPrice: toNumber(item?.totalPrice),
          saleByBasket: toBoolean(item?.saleByBasket)
        }))
      : []
  };
}

export function mapGame(snapshot: QueryDocumentSnapshot<DocumentData>): Game {
  const data = mapDoc(snapshot, defaultGame);
  return {
    ...data,
    tableId: toText(data.tableId),
    sessionId: toText(data.sessionId),
    startTime: toMillis(data.startTime),
    endTime: data.endTime ? toMillis(data.endTime) : null,
    pricePerGame: toNumber(data.pricePerGame),
    participants: Array.isArray(data.participants)
      ? data.participants.map((participant) => ({
          clientId: toText(participant?.clientId),
          clientName: toText(participant?.clientName),
          joinedAt: toMillis(participant?.joinedAt)
        }))
      : [],
    bets: Array.isArray(data.bets)
      ? data.bets.map((bet) => ({
          productId: toText(bet?.productId),
          productName: toText(bet?.productName),
          quantity: toNumber(bet?.quantity),
          unitPrice: toNumber(bet?.unitPrice),
          totalPrice: toNumber(bet?.totalPrice),
          betByClientIds: Array.isArray(bet?.betByClientIds)
            ? bet.betByClientIds.map((clientId) => toText(clientId))
            : []
        }))
      : [],
    loserIds: Array.isArray(data.loserIds)
      ? data.loserIds.map((clientId) => toText(clientId))
      : [],
    amountPerLoser: toNumber(data.amountPerLoser),
    isPaid: toBoolean(data.isPaid),
    status:
      data.status === "FINISHED" || data.status === "CANCELLED" ? data.status : "ACTIVE",
    totalAmount: toNumber(data.totalAmount)
  };
}

async function getClient(userId: string, clientId: string): Promise<Client | null> {
  const snapshot = await getDoc(doc(db, "businesses", userId, "clients", clientId));
  if (!snapshot.exists()) return null;
  return mapDoc(snapshot, defaultClient);
}

function saleToFirestore(sale: Sale) {
  return {
    ...sale,
    paid: sale.isPaid,
    isPaid: sale.isPaid
  };
}

export async function addOrUpdateProduct(userId: string, product: Product): Promise<void> {
  const ref = product.id
    ? doc(db, "businesses", userId, "products", product.id)
    : doc(businessCollection(userId, "products"));

  await setDoc(ref, {
    ...product,
    id: ref.id
  });
}

export async function deleteProduct(userId: string, productId: string): Promise<void> {
  await deleteDoc(doc(db, "businesses", userId, "products", productId));
}

export async function addOrUpdateClient(userId: string, client: Client): Promise<void> {
  const ref = client.id
    ? doc(db, "businesses", userId, "clients", client.id)
    : doc(businessCollection(userId, "clients"));

  const current = client.id ? await getClient(userId, client.id) : null;

  await setDoc(ref, {
    ...client,
    id: ref.id,
    deuda: current?.deuda ?? client.deuda ?? 0,
    deudaOriginal: current?.deudaOriginal ?? client.deudaOriginal ?? 0,
    totalPagado: current?.totalPagado ?? client.totalPagado ?? 0
  });
}

export async function deleteClient(userId: string, clientId: string): Promise<void> {
  await deleteDoc(doc(db, "businesses", userId, "clients", clientId));
}

export async function addOrUpdateExpense(userId: string, expense: Expense): Promise<void> {
  const ref = expense.id
    ? doc(db, "businesses", userId, "expenses", expense.id)
    : doc(businessCollection(userId, "expenses"));

  const current = expense.id
    ? await getDoc(doc(db, "businesses", userId, "expenses", expense.id))
    : null;

  await setDoc(ref, {
    ...expense,
    id: ref.id,
    date:
      current?.exists() && current.data()?.date
        ? String(current.data()?.date)
        : expense.date || String(Date.now())
  });
}

export async function deleteExpense(userId: string, expenseId: string): Promise<void> {
  await deleteDoc(doc(db, "businesses", userId, "expenses", expenseId));
}

export async function addSale(userId: string, sale: Sale): Promise<void> {
  const salesRef = sale.id
    ? doc(db, "businesses", userId, "sales", sale.id)
    : doc(businessCollection(userId, "sales"));
  const finalSale = { ...sale, id: salesRef.id };

  await runTransaction(db, async (transaction) => {
    const productSnapshots = new Map<
      string,
      { ref: ReturnType<typeof doc>; stock: number; unitsPerPackage: number }
    >();

    if (!finalSale.isGameSale) {
      for (const item of finalSale.items) {
        const productRef = doc(db, "businesses", userId, "products", item.productId);
        const snapshot = await transaction.get(productRef);
        productSnapshots.set(item.productId, {
          ref: productRef,
          stock: Number(snapshot.data()?.stock ?? 0),
          unitsPerPackage: Number(snapshot.data()?.unitsPerPackage ?? 1)
        });
      }
    }

    let clientSnapshot:
      | { ref: ReturnType<typeof doc>; deudaOriginal: number; totalPagado: number; deuda: number }
      | null = null;

    if (!finalSale.isPaid && finalSale.clientId) {
      const clientRef = doc(db, "businesses", userId, "clients", finalSale.clientId);
      const snapshot = await transaction.get(clientRef);
      clientSnapshot = {
        ref: clientRef,
        deudaOriginal: Number(snapshot.data()?.deudaOriginal ?? 0),
        totalPagado: Number(snapshot.data()?.totalPagado ?? 0),
        deuda: Number(snapshot.data()?.deuda ?? 0)
      };
    }

    productSnapshots.forEach((productSnapshot, productId) => {
      const item = finalSale.items.find((entry) => entry.productId === productId);
      if (!item) return;

      const unitsToSubtract = item.saleByBasket
        ? item.quantity * productSnapshot.unitsPerPackage
        : item.quantity;

      transaction.update(productSnapshot.ref, {
        stock: Math.max(productSnapshot.stock - unitsToSubtract, 0)
      });
    });

    transaction.set(salesRef, saleToFirestore(finalSale));

    if (clientSnapshot) {
      const saleAmount = getSaleAmount(finalSale);
      const newDeudaOriginal = clientSnapshot.deudaOriginal + saleAmount;
      const shouldReset = clientSnapshot.deuda <= 0.01;
      const newDebt = shouldReset
        ? newDeudaOriginal
        : Math.max(newDeudaOriginal - clientSnapshot.totalPagado, 0);

      transaction.update(clientSnapshot.ref, {
        deuda: newDebt,
        deudaOriginal: newDeudaOriginal,
        totalPagado: shouldReset ? 0 : clientSnapshot.totalPagado
      });
    }
  });
}

export async function deleteSale(userId: string, sale: Sale): Promise<void> {
  await runTransaction(db, async (transaction) => {
    // === FASE 1: TODAS LAS LECTURAS ===
    const readData: {
      products: Map<string, { ref: ReturnType<typeof doc>; stock: number; units: number }>;
      client: { ref: ReturnType<typeof doc>; deudaOriginal: number; totalPagado: number } | null;
    } = {
      products: new Map(),
      client: null
    };

    // Leer todos los productos si no es venta de juego
    if (!sale.isGameSale) {
      for (const item of sale.items) {
        const productRef = doc(db, "businesses", userId, "products", item.productId);
        const snapshot = await transaction.get(productRef);
        readData.products.set(item.productId, {
          ref: productRef,
          stock: Number(snapshot.data()?.stock ?? 0),
          units: Number(snapshot.data()?.unitsPerPackage ?? 1)
        });
      }
    }

    // Leer cliente si tiene deuda pendiente
    if (!sale.isPaid && sale.clientId) {
      const clientRef = doc(db, "businesses", userId, "clients", sale.clientId);
      const snapshot = await transaction.get(clientRef);
      readData.client = {
        ref: clientRef,
        deudaOriginal: Number(snapshot.data()?.deudaOriginal ?? 0),
        totalPagado: Number(snapshot.data()?.totalPagado ?? 0)
      };
    }

    // === FASE 2: TODAS LAS ESCRITURAS ===
    // Restaurar stock de productos
    readData.products.forEach((productData, productId) => {
      const item = sale.items.find((entry) => entry.productId === productId);
      if (item) {
        const restoreUnits = item.saleByBasket ? item.quantity * productData.units : item.quantity;
        transaction.update(productData.ref, {
          stock: productData.stock + restoreUnits
        });
      }
    });

    // Restaurar deuda del cliente
    if (readData.client) {
      const newOriginal = Math.max(readData.client.deudaOriginal - getSaleAmount(sale), 0);
      transaction.update(readData.client.ref, {
        deudaOriginal: newOriginal,
        deuda: Math.max(newOriginal - readData.client.totalPagado, 0)
      });
    }

    // Eliminar venta
    transaction.delete(doc(db, "businesses", userId, "sales", sale.id));
  });
}

export async function markSaleAsPaid(userId: string, saleId: string): Promise<void> {
  await updateDoc(doc(db, "businesses", userId, "sales", saleId), {
    paid: true,
    isPaid: true
  });
}

export async function addOrUpdateTable(userId: string, table: TableEntity): Promise<void> {
  const ref = table.id
    ? doc(db, "businesses", userId, "tables", table.id)
    : doc(businessCollection(userId, "tables"));

  await setDoc(ref, {
    ...table,
    id: ref.id
  });
}

export async function deleteTable(userId: string, tableId: string): Promise<void> {
  await deleteDoc(doc(db, "businesses", userId, "tables", tableId));
}

export async function startSession(
  userId: string,
  tableId: string
): Promise<TableSession> {
  const sessionRef = doc(businessCollection(userId, "table_sessions"));
  const session: TableSession = {
    id: sessionRef.id,
    tableId,
    startTime: Date.now(),
    endTime: null,
    sales: [],
    total: 0
  };

  await setDoc(sessionRef, session);
  await updateDoc(doc(db, "businesses", userId, "tables", tableId), {
    currentSessionId: session.id
  });

  return session;
}

export async function createGame(
  userId: string,
  game: Omit<Game, "id">
): Promise<Game> {
  const gameRef = doc(businessCollection(userId, "games"));
  const finalGame = { ...game, id: gameRef.id };
  await setDoc(gameRef, finalGame);
  return finalGame;
}

export async function updateGame(userId: string, game: Game): Promise<void> {
  await setDoc(doc(db, "businesses", userId, "games", game.id), game);
}

export async function addParticipantsToGame(
  userId: string,
  game: Game,
  participants: GameParticipant[]
): Promise<void> {
  await updateGame(userId, {
    ...game,
    participants: [...game.participants, ...participants]
  });
}

export async function removeParticipantFromGame(
  userId: string,
  game: Game,
  clientId: string
): Promise<void> {
  await updateGame(userId, {
    ...game,
    participants: game.participants.filter((participant) => participant.clientId !== clientId)
  });
}

export async function addBetToGame(
  userId: string,
  game: Game,
  bet: GameBet
): Promise<void> {
  await updateGame(userId, {
    ...game,
    bets: [...game.bets, bet]
  });
}

export async function removeBetFromGame(
  userId: string,
  game: Game,
  index: number
): Promise<void> {
  await updateGame(userId, {
    ...game,
    bets: game.bets.filter((_, betIndex) => betIndex !== index)
  });
}

export async function restartGame(
  userId: string,
  game: Game,
  loserIds: string[]
): Promise<void> {
  const totalAmount =
    game.pricePerGame + game.bets.reduce((sum, bet) => sum + bet.totalPrice, 0);
  const amountPerLoser = loserIds.length > 0 ? totalAmount / loserIds.length : 0;

  const finishedGame: Game = {
    ...game,
    loserIds,
    isPaid: false,
    status: "FINISHED",
    totalAmount,
    amountPerLoser,
    endTime: Date.now()
  };

  const newGameRef = doc(businessCollection(userId, "games"));
  const newGame: Game = {
    ...game,
    id: newGameRef.id,
    startTime: Date.now(),
    endTime: null,
    loserIds: [],
    amountPerLoser: 0,
    isPaid: false,
    status: "ACTIVE",
    totalAmount: 0,
    participants: [...game.participants],
    bets: [...game.bets]
  };

  await runTransaction(db, async (transaction) => {
    transaction.set(doc(db, "businesses", userId, "games", finishedGame.id), finishedGame);
    transaction.set(newGameRef, newGame);
  });
}

export async function finishTableSession(
  userId: string,
  sessionGames: Game[],
  activeGameId: string,
  activeGameLosers: string[],
  isPaid: boolean,
  products: Product[],
  tableId: string,
  sessionId: string
): Promise<void> {
  const finalizedGames = sessionGames.map((game) => {
    if (game.id === activeGameId) {
      const totalAmount = game.pricePerGame + game.bets.reduce((sum, bet) => sum + bet.totalPrice, 0);
      const amountPerLoser = activeGameLosers.length > 0 ? totalAmount / activeGameLosers.length : 0;
      return {
        ...game,
        loserIds: activeGameLosers,
        isPaid,
        status: "FINISHED" as const,
        totalAmount,
        amountPerLoser,
        endTime: Date.now()
      };
    }
    return { ...game, isPaid };
  });

  const sales = finalizedGames.flatMap((g) => prepareGameSales(g, products));

  await runTransaction(db, async (transaction) => {
    const readData: {
      products: Map<string, { ref: ReturnType<typeof doc>; stock: number; units: number }>;
      clients: Map<
        string,
        { ref: ReturnType<typeof doc>; deudaOriginal: number; totalPagado: number; deuda: number }
      >;
    } = {
      products: new Map(),
      clients: new Map()
    };

    for (const sale of sales) {
      for (const item of sale.items) {
        if (!readData.products.has(item.productId)) {
          const productRef = doc(db, "businesses", userId, "products", item.productId);
          const productSnapshot = await transaction.get(productRef);
          readData.products.set(item.productId, {
            ref: productRef,
            stock: Number(productSnapshot.data()?.stock ?? 0),
            units: Number(productSnapshot.data()?.unitsPerPackage ?? 1)
          });
        }
      }
    }

    for (const sale of sales) {
      if (!sale.isPaid && sale.clientId && !readData.clients.has(sale.clientId)) {
        const clientRef = doc(db, "businesses", userId, "clients", sale.clientId);
        const clientSnapshot = await transaction.get(clientRef);
        readData.clients.set(sale.clientId, {
          ref: clientRef,
          deudaOriginal: Number(clientSnapshot.data()?.deudaOriginal ?? 0),
          totalPagado: Number(clientSnapshot.data()?.totalPagado ?? 0),
          deuda: Number(clientSnapshot.data()?.deuda ?? 0)
        });
      }
    }

    for (const game of finalizedGames) {
      transaction.set(doc(db, "businesses", userId, "games", game.id), game);
    }

    const createdSaleIds: string[] = [];

    for (const saleDraft of sales) {
      const saleRef = doc(businessCollection(userId, "sales"));
      const sale: Sale = { ...saleDraft, id: saleRef.id };
      transaction.set(saleRef, saleToFirestore(sale));
      createdSaleIds.push(sale.id);

      for (const item of sale.items) {
        const productData = readData.products.get(item.productId);
        if (productData) {
          const toSubtract = item.saleByBasket ? item.quantity * productData.units : item.quantity;
          transaction.update(productData.ref, {
            stock: Math.max(productData.stock - toSubtract, 0)
          });
        }
      }

      if (!sale.isPaid && sale.clientId) {
        const clientData = readData.clients.get(sale.clientId);
        if (clientData) {
          const saleAmount = getSaleAmount(sale);
          const newOriginal = clientData.deudaOriginal + saleAmount;
          const shouldReset = clientData.deuda <= 0.01;

          transaction.update(clientData.ref, {
            deuda: shouldReset ? newOriginal : Math.max(newOriginal - clientData.totalPagado, 0),
            deudaOriginal: newOriginal,
            totalPagado: shouldReset ? 0 : clientData.totalPagado
          });
        }
      }
    }

    transaction.update(doc(db, "businesses", userId, "table_sessions", sessionId), { endTime: Date.now() });

    const newSessionRef = doc(businessCollection(userId, "table_sessions"));
    transaction.set(newSessionRef, {
      id: newSessionRef.id,
      tableId,
      startTime: Date.now(),
      endTime: null,
      sales: [],
      total: 0
    });

    transaction.update(doc(db, "businesses", userId, "tables", tableId), { currentSessionId: newSessionRef.id });
  });
}

export async function registerPayment(
  userId: string,
  clientId: string,
  amount: number,
  description: string,
  notes: string
): Promise<void> {
  const clientRef = doc(db, "businesses", userId, "clients", clientId);
  const clientSnapshot = await getDoc(clientRef);
  const currentClient = mapDoc(clientSnapshot, defaultClient);

  const [salesSnapshot, paymentsSnapshot] = await Promise.all([
    getDocs(query(businessCollection(userId, "sales"), where("clientId", "==", clientId))),
    getDocs(query(businessCollection(userId, "payments"), where("clientId", "==", clientId)))
  ]);

  const sales = salesSnapshot.docs.map(mapSale);
  const payments = paymentsSnapshot.docs.map(mapPayment);
  const debtInfo = calculatePendingDebt(clientId, sales, [currentClient], payments);

  const paymentRef = doc(businessCollection(userId, "payments"));
  await setDoc(paymentRef, {
    id: paymentRef.id,
    clientId,
    amount,
    date: Date.now(),
    description: description || "Pago de deuda",
    paymentMethod: "CASH",
    relatedSales: [],
    isPartialPayment: debtInfo.remainingDebt > amount,
    notes
  });

  const totalPaid = currentClient.totalPagado + amount;
  const remaining = Math.max(currentClient.deudaOriginal - totalPaid, 0);

  await updateDoc(clientRef, {
    deuda: remaining,
    deudaOriginal: remaining <= 0 ? 0 : currentClient.deudaOriginal,
    totalPagado: remaining <= 0 ? 0 : totalPaid
  });

  if (remaining <= 0) {
    await Promise.all(
      debtInfo.pendingSales.map((sale) => markSaleAsPaid(userId, sale.id))
    );
    return;
  }

  let cumulative = 0;
  for (const sale of debtInfo.pendingSales) {
    cumulative += getSaleAmount(sale);
    if (cumulative <= totalPaid) {
      await markSaleAsPaid(userId, sale.id);
    }
  }
}

export function computeSaleLineItem(product: Product, quantity: number, saleByBasket: boolean) {
  const unitPrice = saleByBasket
    ? product.saleBasketPrice ?? 0
    : product.salePrice;
  const totalPrice = unitPrice * quantity;

  return {
    productId: product.id,
    productName: product.name,
    quantity,
    unitPrice,
    totalPrice,
    saleByBasket
  };
}

export function calculateProductMetrics(product: Product) {
  const supplierPerUnit = calculateSupplierPricePerUnit(
    product.supplierPrice,
    product.unitsPerPackage
  );
  const profitPerUnit = product.salePrice - supplierPerUnit;
  return {
    supplierPerUnit,
    profitPerUnit
  };
}
