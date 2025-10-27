"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import { CreateAccountDialog } from "@/components/Accounts/CreateAccountDialog";
import { CreateTransactionDialog } from "@/components/Transactions/CreateTransactionDialog";
import { CreateBudgetDialog } from "@/components/Budgets/CreateBudgetDialog";
import { CreateCategoryDialog } from "@/components/Categories/CreateCategoryDialog";

import { AccountsService } from "@/services/accounts";
import { TransactionsService } from "@/services/transactions";
import { BudgetsService } from "@/services/budgets";
import { CategoriesService } from "@/services/categories";

import { useAccounts } from "@/contexts/AccountsContext";
import type { Account, Category } from "@/lib/types";

export function QuickActionsCard() {
  const [openAccountDialog, setOpenAccountDialog] = React.useState(false);
  const [openTransactionDialog, setOpenTransactionDialog] = React.useState(false);
  const [openBudgetDialog, setOpenBudgetDialog] = React.useState(false);
  const [openCategoryDialog, setOpenCategoryDialog] = React.useState(false);

  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);

  const { refreshAccounts } = useAccounts();

  React.useEffect(() => {
    const fetchData = async () => {
      const acc = await AccountsService.getAll();
      const cat = await CategoriesService.getAll();
      setAccounts(acc);
      setCategories(cat);
    };
    fetchData();
  }, []);

  const handleSaveAccount = async (data: any) => {
    await AccountsService.create(data);
    await refreshAccounts();
    setOpenAccountDialog(false);
  };

  const handleSaveTransaction = async (data: any) => {
    await TransactionsService.create(data);
    setOpenTransactionDialog(false);
  };

  const handleSaveBudget = async (data: any) => {
    await BudgetsService.create(data);
    setOpenBudgetDialog(false);
  };

  const handleSaveCategory = async (data: any) => {
    await CategoriesService.create(data);
    setOpenCategoryDialog(false);
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 flex-1">
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="flex items-center justify-center gap-2"
              onClick={() => setOpenAccountDialog(true)}
            >
              <Plus className="w-4 h-4" />
              Add Account
            </Button>

            <Button
              variant="outline"
              className="flex items-center justify-center gap-2"
              onClick={() => setOpenTransactionDialog(true)}
            >
              <Plus className="w-4 h-4" />
              Add Transaction
            </Button>

            <Button
              variant="outline"
              className="flex items-center justify-center gap-2"
              onClick={() => setOpenBudgetDialog(true)}
            >
              <Plus className="w-4 h-4" />
              Add Budget
            </Button>

            <Button
              variant="outline"
              className="flex items-center justify-center gap-2"
              onClick={() => setOpenCategoryDialog(true)}
            >
              <Plus className="w-4 h-4" />
              Add Category
            </Button>
          </div>

          <div className="flex-1" />
        </CardContent>
      </Card>

      <CreateAccountDialog
        open={openAccountDialog}
        onClose={() => setOpenAccountDialog(false)}
        onSave={handleSaveAccount}
      />

      <CreateTransactionDialog
        open={openTransactionDialog}
        onClose={() => setOpenTransactionDialog(false)}
        accounts={accounts}
        categories={categories}
        onSave={handleSaveTransaction}
      />

      <CreateBudgetDialog
        open={openBudgetDialog}
        onClose={() => setOpenBudgetDialog(false)}
        categories={categories}
        onSave={handleSaveBudget}
      />

      <CreateCategoryDialog
        open={openCategoryDialog}
        onClose={() => setOpenCategoryDialog(false)}
        onSave={handleSaveCategory}
      />
    </>
  );
}
