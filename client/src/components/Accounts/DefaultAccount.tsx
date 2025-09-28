"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { AccountsService } from "@/services/accounts";
import type { Account } from "@/lib/types";

export function DefaultAccountCard() {
  const [defaultAccount, setDefaultAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchDefault = async () => {
      try {
        const account = await AccountsService.getDefaultAccount();
        if (mounted) setDefaultAccount(account ?? null);
      } catch (error) {
        console.error("Error fetching default account:", error);
        if (mounted) setDefaultAccount(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDefault();
    return () => {
      mounted = false;
    };
  }, []);

  const renderBalance = () => {
    if (loading) return "Loading...";
    if (!defaultAccount || defaultAccount.balance === undefined || defaultAccount.balance === null) {
      return "No data";
    }

    const amount = Number(defaultAccount.balance);
    if (Number.isNaN(amount)) return "No data";

    const formatted = amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    });

    return `${formatted} ${defaultAccount.currency ?? ""}`;
  };

  const renderName = () => {
    if (loading) return "Loading...";
    if (!defaultAccount?.name) return "No data";
    return defaultAccount.name;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardDescription className="text-xl">Default Account</CardDescription>
        <CardTitle className="text-4xl font-semibold tabular-nums @[250px]/card:text-5xl">
          {renderBalance()}
        </CardTitle>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <p className="text-muted-foreground">
          Default Account: {renderName()}
        </p>
      </CardFooter>
    </Card>
  );
}
