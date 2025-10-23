"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BudgetsTable } from "@/components/Budgets/BudgetsTable";
import { CreateBudgetDialog } from "@/components/Budgets/CreateBudgetDialog";
import { BudgetsService } from "@/services/budgets";
import { CategoriesService } from "@/services/categories";
import type { Category } from "@/lib/types";

export default function Budgets() {
  const [createOpen, setCreateOpen] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);

  const triggerRefresh = () => setRefreshSignal((prev) => prev + 1);
  useEffect(() => {
    const fetchCategories = async () => {
      const cats = await CategoriesService.getAll();
      setCategories(cats.filter((c) => c.type === "expense"));
    };
    fetchCategories();
  }, []);

  return (
    <div className="w-full h-full flex-col justify-center items-center p-10">
      <div className="mb-6 w-full flex flex-col md:flex-row md:justify-between md:items-end gap-2">
        <div>
          <h1 className="text-2xl font-bold">Your Budgets</h1>
          <p>Manage your budgets for different categories here.</p>
        </div>
        <div className="flex justify-end mb-4">
          <Button onClick={() => setCreateOpen(true)}>+ Add Budget</Button>
        </div>
      </div>

      <Card>
        <BudgetsTable refreshSignal={refreshSignal} />
      </Card>

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
    </div>
  );
}
