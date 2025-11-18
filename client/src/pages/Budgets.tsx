"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BudgetsTable } from "@/components/Budgets/BudgetsTable";
import { CreateBudgetDialog } from "@/components/Budgets/CreateBudgetDialog";
import { EditBudgetDialog } from "@/components/Budgets/EditBudgetDialog";
import { BudgetsService } from "@/services/budgets";
import { CategoriesService } from "@/services/categories";
import type { Category, Budget } from "@/lib/types";
import { useUserSettings } from "@/contexts/UserSettingsContext";

export default function BudgetsPage() {
  const { settings } = useUserSettings();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const fetchBudgets = async () => {
    if (!settings) return;
    const userCurrency = settings.defaultCurrency ?? "USD";

    const active = await BudgetsService.getBudgetsByType(userCurrency, "active");
    const completed = await BudgetsService.getBudgetsByType(userCurrency, "completed");
    setBudgets([...active, ...completed]);
  };

  const fetchCategories = async () => {
    const cats = await CategoriesService.getAll();
    setCategories(cats.filter(c => c.type === "expense"));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (settings) fetchBudgets();
  }, [settings]);

  const triggerRefresh = async () => {
    await fetchBudgets();
  };

  const handleEditOpen = (budget: Budget) => {
    setEditingBudget(budget);
    setEditOpen(true);
  };

  const handleEditSave = async (id: string, data: Partial<Budget>) => {
    await BudgetsService.update(id, data);
    setEditOpen(false);
    triggerRefresh();
  };

  const activeBudgets = budgets.filter(b => b.status === "active");
  const completedBudgets = budgets.filter(b => b.status === "completed");

  // Group completed budgets by month and year
  const completedGrouped = completedBudgets.reduce<Record<string, Budget[]>>((acc, b) => {
    const date = new Date(b.endDate);
    const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(b);
    return acc;
  }, {});

  return (
    <div className="w-full h-full flex-col justify-center items-center p-10 space-y-6">
      <div className="w-full flex flex-col md:flex-row md:justify-between md:items-end gap-2">
        <div>
          <h1 className="text-2xl font-bold">Your Budgets</h1>
          <p>Manage your budgets for different categories here.</p>
        </div>
        <div className="flex justify-end mb-4">
          <Button onClick={() => setCreateOpen(true)}>+ Add Budget</Button>
        </div>
      </div>

      {activeBudgets.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-2">Active Budgets</h2>
          <Card className="mb-6">
            <BudgetsTable
              budgets={activeBudgets}
              onEdit={handleEditOpen}
              refreshSignal={0}
              currency={settings?.defaultCurrency}
              locale={settings?.locale}
            />
          </Card>
        </>
      )}

      <h2 className="text-xl font-semibold mb-2">Completed Budgets</h2>
      {Object.entries(completedGrouped)
        .sort((a, b) => (a[0] < b[0] ? 1 : -1))
        .map(([month, groupBudgets]) => (
          <div key={month} className="mb-4">
            <h3 className="text-lg font-semibold mb-2">
              {new Date(`${month}-01`).toLocaleString(settings?.locale ?? "en-US", {
                month: "long",
                year: "numeric",
              })}
            </h3>
            <Card>
              <BudgetsTable
                budgets={groupBudgets}
                onEdit={handleEditOpen}
                refreshSignal={0}
                currency={settings?.defaultCurrency}
                locale={settings?.locale}
              />
            </Card>
          </div>
        ))}

      <CreateBudgetDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        categories={categories}
        onSave={async (data) => {
          await BudgetsService.create(data);
          setCreateOpen(false);
          triggerRefresh();
        }}
      />

      {editingBudget && (
        <EditBudgetDialog
          budget={editingBudget}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}
