/**
 * Game Table Model
 * Modelo de dominio para Mesa de Juego
 */

export interface GameTable {
  id: string;
  userId: string;
  number: number;
  status: "available" | "playing" | "maintenance";
  pricePerHour: number;
  currentGame?: {
    startTime: number;
    players: string[];
    rental?: number; // ID de la renta si existe
  };
  createdAt: number;
  updatedAt: number;
}

export interface GameSession {
  id: string;
  tableId: string;
  userId: string;
  startTime: number;
  endTime?: number;
  players: string[];
  totalCost: number;
  paymentStatus: "pending" | "paid";
  notes?: string;
}

export const defaultGameTable: GameTable = {
  id: "",
  userId: "",
  number: 0,
  status: "available",
  pricePerHour: 0,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};
