"use client";

import { useState, useEffect } from "react";
import { CreateAccountDialog } from "@/components/Accounts/CreateAccountDialog";
import { Button } from "@/components/ui/button";
import { AccountsService } from "@/services/accounts";
import { AccountsTable } from "@/components/Accounts/AccountsTable";
import { Card } from "@/components/ui/card";
import { useAccounts } from "@/contexts/AccountsContext";

export default function Accounts() {
  const [openAccountDialog, setOpenAccountDialog] = useState(false);
  const [totalBalance, setTotalBalance] = useState<string>("Loading...");
  const { refreshAccounts } = useAccounts();

  const handleSaveAccount = async (data: any) => {
    await AccountsService.create(data);
    await refreshAccounts();
    setOpenAccountDialog(false);
  };

  useEffect(() => {
    let mounted = true;

    const fetchBalance = async () => {
      try {
        const res = await AccountsService.getTotalBalanceAndCurrency();
        if (!mounted) return;

        if (!res || res.totalBalance == null) {
          setTotalBalance("No data");
          return;
        }

        const amount = Number(res.totalBalance);
        if (Number.isNaN(amount)) {
          setTotalBalance("No data");
          return;
        }

        const formatted = amount.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

        setTotalBalance(`${formatted} ${res.currency ?? ""}`);
      } catch (error) {
        console.error("Error fetching total balance:", error);
        if (mounted) setTotalBalance("No data");
      }
    };

    fetchBalance();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center p-10">
      <div className="mb-6 w-full flex flex-col md:flex-row md:justify-between md:items-end gap-2">
        <div>
          <h1 className="text-4xl font-bold">Your All Accounts</h1>
          <p className="text-lg text-muted-foreground mt-1">
            Total Balance: <span className="font-semibold">{totalBalance}</span>
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => setOpenAccountDialog(true)}  >+ Add Account</Button>
        </div>
      </div>

      <Card className="w-full">
        <AccountsTable />
      </Card>

      <CreateAccountDialog
        open={openAccountDialog}
        onClose={() => setOpenAccountDialog(false)}
        onSave={handleSaveAccount}
      />
    </div>
  );
}
