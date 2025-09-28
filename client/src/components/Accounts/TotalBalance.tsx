"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { AccountsService } from "@/services/accounts";
import type { TotalBalanceResponse } from "@/lib/types";

export function TotalBalanceCard() {
  const [data, setData] = useState<TotalBalanceResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchBalance = async () => {
      try {
        const res = await AccountsService.getTotalBalanceAndCurrency();
        if (!mounted) return;
        setData(res ?? null);
      } catch (error) {
        console.error("Error fetching total balance:", error);
        if (mounted) setData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchBalance();
    return () => {
      mounted = false;
    };
  }, []);

  const renderValue = () => {
    if (loading) return "Loading...";

    // brak odpowiedzi z API -> "No data"
    if (!data || data.totalBalance === undefined || data.totalBalance === null) {
      return "No data";
    }

    // upewnij się, że mamy liczbę
    const amount = Number(data.totalBalance);
    if (Number.isNaN(amount)) return "No data";

    // formatowanie z kropką (en-US). Jeśli nie chcesz separatora tysięcy -> useGrouping: false
    const formatted = amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    });

    return `${formatted} ${data.currency ?? ""}`;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardDescription className="text-xl">Total Balance</CardDescription>
        <CardTitle className="text-4xl font-semibold tabular-nums @[250px]/card:text-5xl">
          {renderValue()}
        </CardTitle>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <p className="text-muted-foreground">
          This is the total balance across all your accounts converted to your default currency.
        </p>
      </CardFooter>
    </Card>
  );
}
