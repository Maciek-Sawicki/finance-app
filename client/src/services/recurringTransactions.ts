import api from "@/lib/api";
import type { RecurringTransaction } from "@/lib/types";

export const RecurringTransactionsService = {
  getAll: async (): Promise<RecurringTransaction[]> => {
    const res = await api.get("/recurring-transactions");
    return res.data; 
  },

  getById: async (id: string): Promise<RecurringTransaction> => {
    const res = await api.get(`/recurring-transactions/${id}`);
    return res.data;
  },

  create: async (transaction: Partial<RecurringTransaction>) => {
    const res = await api.post("/recurring-transactions", transaction);
    return res.data;
  },

  update: async (id: string, transaction: Partial<RecurringTransaction>) => {
    const res = await api.put(`/recurring-transactions/${id}`, transaction);
    return res.data;
  },

  delete: async (id: string) => {
    await api.delete(`/recurring-transactions/${id}`);
  },

  toggle: async (id: string) => {
    const res = await api.patch(`/recurring-transactions/toggle/${id}`);
    return res.data;
  },
};
