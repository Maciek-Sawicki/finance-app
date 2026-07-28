import api from "@/lib/api";
import type { ImportRecord, ImportTransaction } from "@/lib/types";

export const ImportService = {
  uploadCsv: async (accountId: string, file: File) => {
    const formData = new FormData();
    formData.append("accountId", accountId);
    formData.append("file", file);

    const res = await api.post("/imports", formData);

    return res.data;
  },
  getImports: async (): Promise<ImportRecord[]> => {
    const res = await api.get("/imports");
    return res.data;
  },

  getImportTransactions: async (
    importId: string
  ): Promise<ImportTransaction[]> => {
    const res = await api.get(`/imports/${importId}/transactions`);
    return res.data;
  },

  updateTransactionCategory: async (
    transactionId: string,
    categoryId: string
  ) => {
    const res = await api.patch(
      `/imports/transactions/${transactionId}/category`,
      { categoryId }
    );
    return res.data;
  },

  batchUpdateCategories: async (
    importId: string,
    updates: { transactionId: string; categoryId: string }[]
  ) => {
    const res = await api.patch(
      `/imports/${importId}/categories`,
      { updates }
    );
    return res.data;
  },

  deleteImport: async (importId: string) => {
    const res = await api.delete(`/imports/${importId}`);
    return res.data;
  },
};
