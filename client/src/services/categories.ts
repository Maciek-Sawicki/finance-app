import api from "@/lib/api";
import type { 
  Category,
  YearlyCategoryStats,
  MonthlyCategoryStats
} from "@/lib/types";

export const CategoriesService = {
  getAll: async (): Promise<Category[]> => {
    const res = await api.get("/categories");
    return res.data;
  },

  getById: async (id: string): Promise<Category> => {
    const res = await api.get(`/categories/${id}`);
    return res.data;
  },

  getFavorites: async (): Promise<Category[]> => {
    const res = await api.get("/categories/favorites");
    return res.data;
  },
  

  create: async (category: Partial<Category>): Promise<Category> => {
    const res = await api.post("/categories", category);
    return res.data;
  },

  update: async (id: string, category: Partial<Category>): Promise<Category> => {
    const res = await api.put(`/categories/${id}`, category);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },

  getTopYearlyCategories: async (
    targetCurrency: string,
    type: "expense" | "income"
  ): Promise<YearlyCategoryStats> => {
    const res = await api.get(
      `/category-breakdown/top-yearly-categories`,
      { params: { targetCurrency, type } }
    );
    return res.data;
  },

  getTopMonthlyCategories: async (
    targetCurrency: string,
    type: "expense" | "income"
  ): Promise<MonthlyCategoryStats> => {
    const res = await api.get(
      `/category-breakdown/top-monthly-categories`,
      { params: { targetCurrency, type } }
    );
    return res.data;
  },

};
