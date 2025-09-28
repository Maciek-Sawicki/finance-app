import api from "@/lib/api";
import type { Category } from "@/lib/types";

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
    const res = await api.post("/categories/create", category);
    return res.data;
  },

  update: async (id: string, category: Partial<Category>): Promise<Category> => {
    const res = await api.put(`/categories/${id}`, category);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};
