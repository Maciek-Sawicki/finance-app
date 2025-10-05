"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AccountsService } from "@/services/accounts";
import type { Account } from "@/lib/types";

export function TopAccountsCard() {
  const [accounts, setAccounts] = useState<Account[] | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      const data = await AccountsService.getAll();
      if (!isMounted) return;
      const sorted = [...data].sort((a, b) => b.balance - a.balance);
      setAccounts(sorted.slice(0, 5));
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-3xl font-bold">Top Accounts</CardTitle>
        <CardDescription className="text-lg">
          Accounts with the highest balances
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {!accounts && (
          <div className="text-xl font-medium">Loading...</div>
        )}

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
                {a.balance.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} <span>{a.currency}</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
