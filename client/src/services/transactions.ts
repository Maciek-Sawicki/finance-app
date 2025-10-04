import api from "@/lib/api";
import type { Transaction, Transfer } from "@/lib/types";


export const TransactionsService = {
  getAll: async (): Promise<Transaction[]> => {
    const res = await api.get("/transactions");
    return res.data;
  },
  getById: async (id: string): Promise<Transaction> => {
    const res = await api.get(`/transactions/${id}`);
    return res.data;
  },
  create: async (transaction: Partial<Transaction>): Promise<Transaction> => {
    const res = await api.post("/transactions/create", transaction);
    return res.data;
  },
  update: async (id: string, transaction: Partial<Transaction>): Promise<Transaction> => {
    const res = await api.put(`/transactions/${id}`, transaction);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/transactions/${id}`);
  },
  toggleSettled: async (id: string): Promise<Transaction> => {
    const res = await api.patch(`/transactions/${id}/toggle-settled`);
    return res.data;
  },
  // createTransfer: async (transferData: any): Promise<void> => {
  //   await api.post("/transactions/transfer", transferData);
  // }
  createTransfer: async (transfer: Partial<Transfer>): Promise<Transfer> => {
    const res = await api.post("/transactions/transfer", transfer);
    return res.data;
  }
};
