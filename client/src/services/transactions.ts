import api from "@/lib/api";
import type { Transaction, Transfer } from "@/lib/types";

type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
};

export const TransactionsService = {
  getAll: async (params?: Record<string, any>): Promise<PaginatedResponse<Transaction>> => {
    const res = await api.get("/transactions", { params });
    return res.data;
  },
  getById: async (id: string): Promise<Transaction> => {
    const res = await api.get(`/transactions/${id}`);
    return res.data;
  },
  getByAccountId: async (accountId: string): Promise<Transaction[]> => {
    const res = await api.get(`/transactions`, { params: { accountId: accountId } });
    return res.data;
  },
  create: async (transaction: Partial<Transaction>): Promise<Transaction> => {
    const res = await api.post("/transactions", transaction);
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
  createTransfer: async (transfer: Partial<Transfer>): Promise<Transfer> => {
    const res = await api.post("/transactions/transfer", transfer);
    return res.data;
  },
  getLastTransactions: async (limit: number = 5): Promise<Transaction[]> => {
    const res = await api.get("/transactions/last", { params: { limit } });
    return res.data;
  }
};
