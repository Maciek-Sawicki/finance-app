"use client";

import { useState, useEffect } from "react";
import { CreateAccountDialog } from "@/components/Accounts/CreateAccountDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AccountsTable } from "@/components/Accounts/AccountsTable";
import { useAccounts } from "@/contexts/AccountsContext";
import { AccountsService } from "@/services/accounts";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { useUserSettings } from "@/contexts/UserSettingsContext";

export default function Accounts() {
  const [openAccountDialog, setOpenAccountDialog] = useState(false);
  const [totalBalance, setTotalBalance] = useState<string>("Loading...");
  const { refreshAccounts } = useAccounts();
  const { settings, loading: settingsLoading } = useUserSettings(); 
  const { formatNumber } = useCurrencyFormatter();

  const fetchTotalBalance = async () => {
    if (!settings) return;
    try {
      const res = await AccountsService.getTotalBalanceAndCurrency(settings.defaultCurrency);
      setTotalBalance(`${formatNumber(res.totalBalance)} ${res.currency}`);
    } catch (err) {
      console.error("Error fetching total balance:", err);
      setTotalBalance("No data");
    }
  };

  const handleSaveAccount = async (data: any) => {
    await AccountsService.create(data);
    await refreshAccounts();    
    await fetchTotalBalance(); 
    setOpenAccountDialog(false);
  };

  useEffect(() => {
    if (!settingsLoading) fetchTotalBalance();
  }, [settings, settingsLoading, refreshAccounts]);

  return (
    <div className="w-full h-full flex flex-col items-center p-10">
      <div className="mb-6 w-full flex flex-col md:flex-row md:justify-between md:items-end gap-2">
        <div>
          <h1 className="text-2xl font-bold">Your All Accounts</h1>
          <p className="text-lg text-muted-foreground mt-1">
            Total Balance: <span className="font-semibold">{totalBalance}</span>
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => setOpenAccountDialog(true)}>+ Add Account</Button>
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
