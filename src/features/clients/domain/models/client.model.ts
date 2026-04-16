/**
 * Client Model
 * Modelo de dominio para Cliente
 */

export interface Client {
  id: string;
  nombre: string;
  telefono: string;
  deuda: number;
  deudaOriginal: number;
  totalPagado: number;
}

export const defaultClient: Client = {
  id: "",
  nombre: "",
  telefono: "",
  deuda: 0,
  deudaOriginal: 0,
  totalPagado: 0
};
