"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountsService } from "@/services/accounts";
import type { Account } from "@/lib/types";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

export function TopAccountsCard() {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [loading, setLoading] = useState(true);
  const { formatNumber } = useCurrencyFormatter();

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      const data = await AccountsService.getAll();
      if (!isMounted) return;
      const sorted = [...data].sort((a, b) => b.balance - a.balance);
      setAccounts(sorted.slice(0, 5));
      setLoading(false);
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
          <CardContent className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="flex flex-col gap-2 w-full">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Skeleton key={idx} className="h-8 w-full rounded-md" />
              ))}
            </div>
          </CardContent>
        </>
      ) : (
        <>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Top Accounts</CardTitle>
            <CardDescription className="text-lg">
              Accounts with the highest balances
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {accounts?.map((a) => (
              <div
                key={a._id}
                className="flex justify-between items-center border-b last:border-0 pb-2"
              >
                <div className="truncate max-w-[60%]">
                  <span className="font-medium text-lg">{a.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">
                    {formatNumber(a.balance)} <span>{a.currency}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </>
      )}
    </Card>
  );
}
