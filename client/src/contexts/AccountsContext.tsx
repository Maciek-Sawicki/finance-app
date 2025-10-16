"use client";

import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AccountsService } from "@/services/accounts";
import type { Account, AccountsContextType } from "@/lib/types";

const AccountsContext = React.createContext<AccountsContextType | undefined>(undefined);

export const AccountsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const { user } = useAuth(); 

  const refreshAccounts = React.useCallback(async () => {
    if (!user) return;
    try {
      const data = await AccountsService.getAll();
      setAccounts(data);
    } catch (err) {
      console.error("Failed to fetch accounts:", err);
      setAccounts([]);
    }
  }, [user]);

  React.useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

  return (
    <AccountsContext.Provider value={{ accounts, refreshAccounts }}>
      {children}
    </AccountsContext.Provider>
  );
};

export const useAccounts = () => {
  const context = React.useContext(AccountsContext);
  if (!context) throw new Error("useAccounts must be used within an AccountsProvider");
  return context;
};
