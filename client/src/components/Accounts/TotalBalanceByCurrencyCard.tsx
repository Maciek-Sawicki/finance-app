"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountsService } from "@/services/accounts";
import type { Account } from "@/lib/types";

type CurrencyBalance = {
  currency: string;
  total: number;
};

export function TotalBalanceByCurrencyCard() {
  const [balances, setBalances] = useState<CurrencyBalance[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const accounts: Account[] = await AccountsService.getAll();
        if (!isMounted) return;

        const map: Record<string, number> = {};
        accounts.forEach((a) => {
          map[a.currency] = (map[a.currency] || 0) + a.balance;
        });

        const result = Object.entries(map).map(([currency, total]) => ({
          currency,
          total: parseFloat(total.toFixed(2)),
        }));

        setBalances(result);
      } catch (error) {
        console.error("Error fetching balances:", error);
        if (isMounted) setBalances([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Card className="h-full">
      {loading ? (
        <>
          <CardHeader>
            <Skeleton className="h-6 w-1/3 rounded-md" />
            <Skeleton className="h-8 w-2/3 rounded-md mt-2" />
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-full rounded-md" />
            ))}
          </CardContent>
        </>
      ) : (
        <>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Balances by Currency</CardTitle>
            <CardDescription className="text-lg">Summary of balances per currency</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {balances?.map((b) => (
              <div key={b.currency} className="flex justify-between items-center border-b last:border-0 pb-2">
                <span className="text-lg font-semibold">{b.currency}</span>
                <span className="text-lg font-bold">
                  {b.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </CardContent>
        </>
      )}
    </Card>
  );
}
