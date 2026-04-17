import type {
  Client,
  ClientDebtInfo,
  DashboardSummary,
  Expense,
  Game,
  Payment,
  Product,
  ReportFilter,
  ReportResult,
  Sale,
  SaleItem
} from "../types/models";

function normalizeMillis(input: unknown, fallback = Date.now()): number {
  if (typeof input === "number" && Number.isFinite(input)) return input;
  if (typeof input === "string") {
    const parsed = Number.parseInt(input, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  if (
    typeof input === "object" &&
    input !== null &&
    "toMillis" in input &&
    typeof (input as { toMillis: () => number }).toMillis === "function"
  ) {
    return (input as { toMillis: () => number }).toMillis();
  }
  return fallback;
}

export function getSaleAmount(sale: Sale): number {
  if (sale.totalAmount > 0) return sale.totalAmount;
  if (sale.items.length > 0) {
    return sale.items.reduce((sum, item) => sum + item.totalPrice, 0);
  }
  return sale.price ?? 0;
}

export function getExpenseMillis(expense: Expense): number {
  return normalizeMillis(expense.date);
}

export function calculateSupplierPricePerUnit(
  supplierPrice: number,
  unitsPerPackage: number
): number {
  if (unitsPerPackage <= 0) return 0;
  return supplierPrice / unitsPerPackage;
}

export function calculateProfitForDraftItems(
  items: SaleItem[],
  products: Product[]
): number {
  const productsMap = new Map(products.map((product) => [product.id, product]));

  return items.reduce((acc, item) => {
    const product = productsMap.get(item.productId);
    if (!product) return acc;

    if (item.saleByBasket) {
      const basketPrice = product.saleBasketPrice ?? item.unitPrice;
      const profitPerBasket = basketPrice - product.supplierPrice;
      return acc + profitPerBasket * item.quantity;
    }

    const supplierPerUnit = calculateSupplierPricePerUnit(
      product.supplierPrice,
      product.unitsPerPackage
    );

    return acc + (item.unitPrice - supplierPerUnit) * item.quantity;
  }, 0);
}

export function getSaleProfit(sale: Sale, products: Product[]): number {
  if (sale.isGameSale) {
    return Number.isFinite(sale.profit) ? sale.profit : 0;
  }

  if (sale.items.length > 0) {
    return calculateProfitForDraftItems(sale.items, products);
  }

  if (sale.productId) {
    const product = products.find((entry) => entry.id === sale.productId);
    if (!product) return Number(sale.profit ?? 0);

    const quantity = Math.max(sale.quantity ?? 0, 0);
    const revenue = getSaleAmount(sale);
    const cost =
      calculateSupplierPricePerUnit(product.supplierPrice, product.unitsPerPackage) *
      quantity;

    return revenue - cost;
  }

  return Number(sale.profit ?? 0);
}

export function calculatePendingDebt(
  clientId: string,
  sales: Sale[],
  clients: Client[],
  payments: Payment[]
): ClientDebtInfo {
  const pendingSales = sales
    .filter((sale) => !sale.isPaid && sale.clientId === clientId)
    .sort((a, b) => a.date - b.date);

  const totalDebt = pendingSales.reduce((sum, sale) => sum + getSaleAmount(sale), 0);
  const profile = clients.find((item) => item.id === clientId);
  const totalPaid = profile?.totalPagado ?? 0;

  return {
    clientId,
    totalDebt,
    totalPaid,
    remainingDebt: Math.max(totalDebt - totalPaid, 0),
    pendingSales,
    payments: payments.filter((payment) => payment.clientId === clientId),
    isFullyPaid: totalDebt - totalPaid <= 0
  };
}

function getOutstandingDebtFallback(sales: Sale[]): Map<string, number> {
  const debtByClient = new Map<string, number>();

  sales
    .filter((sale) => !sale.isPaid && sale.clientId)
    .forEach((sale) => {
      debtByClient.set(
        sale.clientId,
        (debtByClient.get(sale.clientId) ?? 0) + getSaleAmount(sale)
      );
    });

  return debtByClient;
}

export function getDateRange(filter: ReportFilter): { start: number; end: number } {
  const now = new Date();
  const cursor = new Date(now);

  if (filter.type === "CUSTOM") {
    return {
      start: filter.startDate ?? 0,
      end: filter.endDate ?? Date.now()
    };
  }

  if (filter.startDate) {
    cursor.setTime(filter.startDate);
  }

  if (filter.type === "DAILY") {
    const start = new Date(cursor);
    start.setHours(0, 0, 0, 0);
    const end = new Date(cursor);
    end.setHours(23, 59, 59, 999);
    return { start: start.getTime(), end: end.getTime() };
  }

  if (filter.type === "WEEKLY") {
    const start = new Date(cursor);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start: start.getTime(), end: end.getTime() };
  }

  const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start: start.getTime(), end: end.getTime() };
}

export function buildDashboardSummary(
  sales: Sale[],
  expenses: Expense[],
  products: Product[],
  clients: Client[]
): DashboardSummary {
  const paidSales = sales.filter((sale) => sale.isPaid);
  const outstandingDebt = getOutstandingDebtFallback(sales);
  const totalIncome = paidSales.reduce((sum, sale) => sum + getSaleAmount(sale), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netProfit =
    paidSales.reduce((sum, sale) => sum + getSaleProfit(sale, products), 0) -
    totalExpenses;
  const totalDebt = clients.reduce(
    (sum, client) =>
      sum + (client.deuda > 0 ? client.deuda : outstandingDebt.get(client.id) ?? 0),
    0
  );
  const lowStockAlerts = products.filter((product) => product.stock <= product.minStock);

  const topMap = new Map<string, number>();
  paidSales.forEach((sale) => {
    if (sale.items.length > 0) {
      sale.items.forEach((item) => {
        const product = products.find((entry) => entry.id === item.productId);
        const units = item.saleByBasket
          ? item.quantity * (product?.unitsPerPackage ?? 1)
          : item.quantity;
        topMap.set(item.productName, (topMap.get(item.productName) ?? 0) + units);
      });
      return;
    }

    if (sale.productName) {
      topMap.set(
        sale.productName,
        (topMap.get(sale.productName) ?? 0) + (sale.quantity ?? 0)
      );
    }
  });

  const topProducts = Array.from(topMap.entries())
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const chartData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const dayProfit =
      paidSales
        .filter((sale) => sale.date >= start.getTime() && sale.date <= end.getTime())
        .reduce((sum, sale) => sum + getSaleProfit(sale, products), 0) -
      expenses
        .filter((expense) => {
          const expenseDate = getExpenseMillis(expense);
          return expenseDate >= start.getTime() && expenseDate <= end.getTime();
        })
        .reduce((sum, expense) => sum + expense.amount, 0);

    return {
      label: date.toLocaleDateString("es-CO", { weekday: "short" }),
      value: dayProfit
    };
  });

  return {
    totalIncome,
    totalExpenses,
    netProfit,
    totalDebt,
    lowStockAlerts,
    topProducts,
    chartData
  };
}

export function buildReport(
  filter: ReportFilter,
  sales: Sale[],
  expenses: Expense[],
  clients: Client[],
  products: Product[],
  tables: Array<{ id: string; name: string }>
): ReportResult {
  const range = getDateRange(filter);
  const filteredSales = sales.filter(
    (sale) => sale.date >= range.start && sale.date <= range.end
  );
  const paidSales = filteredSales.filter((sale) => sale.isPaid);
  const outstandingDebt = getOutstandingDebtFallback(sales);
  const filteredExpenses = expenses.filter((expense) => {
    const expenseDate = getExpenseMillis(expense);
    return expenseDate >= range.start && expenseDate <= range.end;
  });

  const salesByTable: Record<string, number> = {};
  const salesByProduct: Record<string, number> = {};
  const topMap = new Map<string, number>();

  paidSales.forEach((sale) => {
    const saleAmount = getSaleAmount(sale);
    if (sale.tableId) {
      const tableName =
        tables.find((table) => table.id === sale.tableId)?.name ?? "Mesa sin nombre";
      salesByTable[tableName] = (salesByTable[tableName] ?? 0) + saleAmount;
    }

    if (sale.items.length > 0) {
      sale.items.forEach((item) => {
        salesByProduct[item.productName] =
          (salesByProduct[item.productName] ?? 0) + item.totalPrice;
        const product = products.find((entry) => entry.id === item.productId);
        const units = item.saleByBasket
          ? item.quantity * (product?.unitsPerPackage ?? 1)
          : item.quantity;
        topMap.set(item.productName, (topMap.get(item.productName) ?? 0) + units);
      });
      return;
    }

    if (sale.productName) {
      salesByProduct[sale.productName] =
        (salesByProduct[sale.productName] ?? 0) + (sale.price ?? 0);
      topMap.set(
        sale.productName,
        (topMap.get(sale.productName) ?? 0) + (sale.quantity ?? 0)
      );
    }
  });

  return {
    totalSales: paidSales.reduce((sum, sale) => sum + getSaleAmount(sale), 0),
    totalExpenses: filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    netProfit:
      paidSales.reduce((sum, sale) => sum + getSaleProfit(sale, products), 0) -
      filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    totalClientDebt: clients.reduce(
      (sum, client) =>
        sum + (client.deuda > 0 ? client.deuda : outstandingDebt.get(client.id) ?? 0),
      0
    ),
    salesByTable,
    salesByProduct,
    topProducts: Array.from(topMap.entries())
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
  };
}

export function calculateGameTotal(game: Game): number {
  return game.pricePerGame + game.bets.reduce((sum, bet) => sum + bet.totalPrice, 0);
}

export function prepareGameSales(
  game: Game,
  products: Product[]
): Array<Omit<Sale, "id">> {
  const totalAmount = calculateGameTotal(game);
  if (totalAmount <= 0) return [];

  const recipients =
    game.loserIds.length > 0
      ? game.loserIds
      : game.participants.map((participant) => participant.clientId);

  const productsMap = new Map(products.map((product) => [product.id, product]));
  const originalItems = game.bets.map((bet) => ({
    productId: bet.productId,
    productName: bet.productName,
    quantity: bet.quantity,
    unitPrice: bet.unitPrice,
    totalPrice: bet.totalPrice,
    saleByBasket: false
  }));

  const totalCost = originalItems.reduce((sum, item) => {
    const product = productsMap.get(item.productId);
    if (!product) return sum;
    const supplierPerUnit = calculateSupplierPricePerUnit(
      product.supplierPrice,
      product.unitsPerPackage
    );
    return sum + supplierPerUnit * item.quantity;
  }, 0);

  const recipientsCount = recipients.length;
  const profitPerRecipient =
    recipientsCount > 0
      ? totalAmount / recipientsCount - totalCost / recipientsCount
      : totalAmount - totalCost;

  const buildItemsForRecipient = (recipientIndex: number): SaleItem[] => {
    if (recipientsCount <= 0) return originalItems;

    return originalItems
      .map((item) => {
        const baseQuantity = Math.floor(item.quantity / recipientsCount);
        const remainder = item.quantity % recipientsCount;
        const assigned = baseQuantity + (recipientIndex < remainder ? 1 : 0);

        if (assigned <= 0) return null;

        return {
          ...item,
          quantity: assigned,
          totalPrice: assigned * item.unitPrice
        };
      })
      .filter((item): item is SaleItem => item !== null);
  };

  if (recipientsCount === 0) {
    return [
      {
        items: originalItems,
        totalAmount,
        profit: totalAmount - totalCost,
        date: Date.now(),
        tableId: game.tableId,
        type: "TABLE",
        sellerId: "web-system",
        clientId: "",
        isPaid: game.isPaid,
        isGameSale: true,
        gameId: game.id,
        productId: "",
        productName: "",
        quantity: 0,
        price: 0
      }
    ];
  }

  return recipients.map((clientId, index) => ({
    items: buildItemsForRecipient(index),
    totalAmount: totalAmount / recipientsCount,
    profit: profitPerRecipient,
    date: Date.now(),
    tableId: game.tableId,
    type: "TABLE" as const,
    sellerId: "web-system",
    clientId,
    isPaid: game.isPaid,
    isGameSale: true,
    gameId: game.id,
    productId: "",
    productName: "",
    quantity: 0,
    price: 0
  }));
}
