import api from "@/lib/api";
import type { Account } from "@/lib/types";

export const AccountsService = {
  getAll: async (): Promise<Account[]> => {
    const res = await api.get("/accounts");
    return res.data;
  },

  getById: async (id: string): Promise<Account> => {
    const res = await api.get(`/accounts/${id}`);
    return res.data;
  },

  create: async (account: Partial<Account>): Promise<Account> => {
    const res = await api.post("/accounts/create", account);
    return res.data;
  },

  update: async (id: string, account: Partial<Account>): Promise<Account> => {
    const res = await api.put(`/accounts/${id}`, account);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/accounts/${id}`);
  },

  setDefault: async (id: string): Promise<void> => {
    await api.post(`/accounts/${id}/default`);
  },
};
