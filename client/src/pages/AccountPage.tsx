"use client";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TransactionsTable } from "@/components/Transactions/TransactionsTable";
import { CreateTransactionDialogAccount } from "@/components/Transactions/CreateTransactionDialogAccount";
import { AccountsService } from "@/services/accounts";
import { TransactionsService } from "@/services/transactions";
import { CategoriesService } from "@/services/categories";
import { Card } from "@/components/ui/card";
import type { Account, Category, Transaction } from "@/lib/types";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

export default function AccountPage() {
  const { id } = useParams<{ id: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [loadingAccount, setLoadingAccount] = useState(true);
  const { formatNumber } = useCurrencyFormatter();

  useEffect(() => {
    if (!id) return;

    const fetchAccount = async () => {
      setLoadingAccount(true);
      try {
        const accountData = await AccountsService.getById(id);
        setAccount(accountData);
      } finally {
        setLoadingAccount(false);
      }
    };

    fetchAccount();
  }, [id, refreshSignal]);

  useEffect(() => {
    if (!id) return;

    const fetchTransactionsAndCategories = async () => {
      const [transactionData, categoryData] = await Promise.all([
        TransactionsService.getByAccountId(id),
        CategoriesService.getAll(),
      ]);
      setTransactions(transactionData);
      setCategories(categoryData);
    };

    fetchTransactionsAndCategories();
  }, [id, refreshSignal]);

  const handleSave = async (data: any) => {
    await TransactionsService.create(data);
    setRefreshSignal((r) => r + 1);
  };

  return (
    <div className="w-full h-full flex flex-col p-10">
      <div className="mb-6 w-full flex flex-col md:flex-row md:justify-between md:items-end gap-2">
        <div>
          <h1 className="text-2xl font-bold">{account?.name || "Loading..."}</h1>
          <p className="text-lg text-muted-foreground mt-1">
            Balance:{" "}
            <span className="font-semibold">
              {loadingAccount
                ? "..."
                : account?.balance !== undefined && account?.balance !== null
                  ? `${formatNumber(account.balance)} ${account.currency}`
                  : "No data"}
            </span>
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => setOpenDialog(true)}>Add transaction</Button>
        </div>
      </div>
      <Card>
        <TransactionsTable
          refreshSignal={refreshSignal}
          accountId={account?._id}
          onUpdated={() => setRefreshSignal((r) => r + 1)}
        />
      </Card>
      {account && (
        <CreateTransactionDialogAccount
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          onSave={handleSave}
          accounts={[account]}
          categories={categories}
        />
      )}
    </div>
  );
}
