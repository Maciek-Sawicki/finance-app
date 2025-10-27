import api from "@/lib/api";
import type { Budget } from "@/lib/types";

export const BudgetsService = {
  getAll: async (targetCurrency?: string): Promise<Budget[]> => {
    const res = await api.get("/budgets", {
      params: targetCurrency ? { targetCurrency } : {},
    });
    return res.data;
  },

  getBudgetsByType : async (targetCurrency: string, status: string): Promise<Budget[]> => {
    const res = await api.get("/budgets/getByType", {
      params: { targetCurrency, status }
    });
    return res.data;
  },

  getById: async (id: string, targetCurrency?: string): Promise<Budget> => {
    const res = await api.get(`/budgets/${id}`, {
      params: targetCurrency ? { targetCurrency } : {},
    });
    return res.data;
  },

  getHistoryByCategory: async (
    categoryId: string,
    targetCurrency?: string
  ): Promise<Budget[]> => {
    const res = await api.get(`/budgets/history/${categoryId}`, {
      params: targetCurrency ? { targetCurrency } : {},
    });
    return res.data;
  },

  create: async (budget: Partial<Budget>): Promise<Budget> => {
    const res = await api.post("/budgets/create", budget);
    return res.data;
  },

  update: async (id: string, budget: Partial<Budget>): Promise<Budget> => {
    const res = await api.put(`/budgets/${id}`, budget);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/budgets/${id}`);
  },
};
