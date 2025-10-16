import api from "@/lib/api";
import type { MonthlySummaryData } from "@/lib/types";

export const DashboardService = {
  getMonthlySummary: async (targetCurrency: string = "USD"): Promise<MonthlySummaryData> => {
    const res = await api.get("/summary/dashboard-summary", {
      params: { targetCurrency },
    });
    return res.data;
  },
};
