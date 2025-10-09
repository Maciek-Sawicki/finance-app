"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

  return (
    <Card className="h-full">
      {loading ? (
        <>
          <CardHeader>
            <Skeleton className="h-6 w-1/3 rounded-md" />
            <Skeleton className="h-8 w-2/3 rounded-md mt-2" />
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <Skeleton className="h-6 w-full rounded-md" />
          </CardFooter>
        </>
      ) : (
        <>
          <CardHeader>
            <CardDescription className="text-xl">Default Account</CardDescription>
            <CardTitle className="text-4xl font-semibold tabular-nums @[250px]/card:text-5xl">
              {defaultAccount?.balance !== undefined && defaultAccount?.balance !== null
                ? `${Number(defaultAccount.balance).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                  useGrouping: true,
                })} ${defaultAccount.currency ?? ""}`
                : "No data"}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <p className="text-muted-foreground">
              Default Account: {defaultAccount?.name ?? "No data"}
            </p>
          </CardFooter>
        </>
      )}
    </Card>
  );
}

