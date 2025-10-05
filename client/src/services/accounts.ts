import api from "@/lib/api";
import type { Account, TotalBalanceResponse, AccountSummary } from "@/lib/types";

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
  getTotalBalanceAndCurrency: async (): Promise<TotalBalanceResponse> => {
    const res = await api.get("/accounts/total-balance");
    return res.data;
  },
  getDefaultAccount: async (): Promise<Account> => {
    const res = await api.get("/accounts/default");
    return res.data; 
  },
  getSummary: async (): Promise<AccountSummary[]> => {
    const res = await api.get("/accounts/summary");
    return res.data; 
  }
};
