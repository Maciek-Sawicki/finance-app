"use client";

import { useEffect, useState } from "react";
import { CreateTransactionDialog } from "@/components/Transactions/CreateTransactionDialog";
import { Button } from "@/components/ui/button";
import { TransactionsService } from "@/services/transactions";
import { AccountsService } from "@/services/accounts";
import { CategoriesService } from "@/services/categories";
import { TransactionsTable } from "@/components/Transactions/TransactionsTable";
import { Card } from "@/components/ui/card";
import type { Account, Category } from "@/lib/types";

export default function Accounts() {
  const [createOpen, setCreateOpen] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const triggerRefresh = () => setRefreshSignal((prev) => prev + 1);

  useEffect(() => {
    const fetchData = async () => {
      const acc = await AccountsService.getAll();
      const cat = await CategoriesService.getAll();
      setAccounts(acc);
      setCategories(cat);
    };
    fetchData();
  }, []);

  const handleSave = async (data: any) => {
    if (data.type === "transfer") {
      if (data.customToAmount) data.toAmount = parseFloat(data.customToAmount);
      await TransactionsService.createTransfer(data);
    } else {
      await TransactionsService.create(data);
    }
    triggerRefresh();
  };

  return (
    <div className="w-full h-full flex-col justify-center items-center p-10">
      <div className="flex justify-end mb-4">
        <Button onClick={() => setCreateOpen(true)}>+ Add Transaction</Button>
      </div>

      <Card>
        <TransactionsTable refreshSignal={refreshSignal} />
      </Card>

      <CreateTransactionDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        accounts={accounts}
        categories={categories}
        onSave={handleSave}
      />
    </div>
  );
}


