"use client";

import { useEffect, useState } from "react";
import { BudgetsService } from "@/services/budgets";
import { useUserSettings } from "@/contexts/UserSettingsContext";
import { BudgetCard } from "@/components/Budgets/BudgetCard";
import type { Budget } from "@/lib/types";
import { Spinner } from "@/components/ui/spinner"; 

export default function BudgetsDashboardPage() {
  const { settings } = useUserSettings();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true); 

  const fetchBudgets = async () => {
    if (!settings) return;
    setLoading(true);
    try {
      const active = await BudgetsService.getBudgetsByType(
        settings.defaultCurrency ?? "USD",
        "active"
      );
      setBudgets(active);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (settings) fetchBudgets();
  }, [settings]);

  return (
    <div className="p-10 w-full">
      <h1 className="text-2xl font-bold mb-6">Budgets Dashboard</h1>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Spinner className="w-10 h-10 text-primary" /> 
        </div>
      ) : budgets.length === 0 ? (
        <p className="text-muted-foreground">No active budgets.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {budgets.map((b) => (
            <BudgetCard
              key={b._id}
              budget={b}
              currency={settings?.defaultCurrency ?? "USD"}
              locale={settings?.locale ?? "en-US"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
