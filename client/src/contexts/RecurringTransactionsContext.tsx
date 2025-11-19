"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { RecurringTransactionsService } from "@/services/recurringTransactions";
import type { RecurringTransaction } from "@/lib/types";

type RecurringTransactionsContextType = {
  transactions: RecurringTransaction[];
  loading: boolean;
  error: string | null;
  createRecurringTransaction: (data: Partial<RecurringTransaction>) => Promise<void>;
  updateRecurringTransaction: (id: string, data: Partial<RecurringTransaction>) => Promise<void>;
  deleteRecurringTransaction: (id: string) => Promise<void>;
  toggleRecurringTransaction: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const RecurringTransactionsContext = createContext<RecurringTransactionsContextType | undefined>(undefined);

export const useRecurringTransactions = () => {
  const context = useContext(RecurringTransactionsContext);
  if (!context) throw new Error("useRecurringTransactions must be used within a RecurringTransactionsProvider");
  return context;
};

export const RecurringTransactionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await RecurringTransactionsService.getAll();
      setTransactions(res); // zakładamy, że getAll zwraca już tablicę
    } catch (e: any) {
      setError(e?.message || "Failed to load recurring transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const refresh = async () => fetchTransactions();

  const createRecurringTransaction = async (data: Partial<RecurringTransaction>) => {
    await RecurringTransactionsService.create(data);
    await fetchTransactions();
  };

  const updateRecurringTransaction = async (id: string, data: Partial<RecurringTransaction>) => {
    await RecurringTransactionsService.update(id, data);
    await fetchTransactions();
  };

  const deleteRecurringTransaction = async (id: string) => {
    await RecurringTransactionsService.delete(id);
    await fetchTransactions();
  };

  const toggleRecurringTransaction = async (id: string) => {
    await RecurringTransactionsService.toggle(id);
    await fetchTransactions();
  };

  return (
    <RecurringTransactionsContext.Provider
      value={{
        transactions,
        loading,
        error,
        createRecurringTransaction,
        updateRecurringTransaction,
        deleteRecurringTransaction,
        toggleRecurringTransaction,
        refresh,
      }}
    >
      {children}
    </RecurringTransactionsContext.Provider>
  );
};
