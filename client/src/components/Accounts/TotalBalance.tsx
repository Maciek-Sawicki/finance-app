"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountsService } from "@/services/accounts";
import type { TotalBalanceResponse } from "@/lib/types";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

import { useUserSettings } from "@/contexts/UserSettingsContext";

export function TotalBalanceCard() {
  const [data, setData] = useState<TotalBalanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { formatNumber } = useCurrencyFormatter();
  const { settings, loading: settingsLoading } = useUserSettings(); 

  const defaultCurrency = settings?.defaultCurrency ?? "USD";

  useEffect(() => {
    if (settingsLoading) return; 

    let mounted = true;

    const fetchBalance = async () => {
      try {
        setLoading(true);
        const res = await AccountsService.getTotalBalanceAndCurrency(defaultCurrency);
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
  }, [defaultCurrency, settingsLoading]);

  return (
    <Card className="h-full">
      {loading || settingsLoading ? (
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
            <CardDescription className="text-xl">Total Balance</CardDescription>
            <CardTitle className="text-4xl font-semibold tabular-nums @[250px]/card:text-5xl">
              {data?.totalBalance != null
                ? `${formatNumber(Number(data.totalBalance))} ${defaultCurrency}`
                : "No data"}
            </CardTitle>
            {data?.totalAfterRP != null && (
              <p className="text-sm text-muted-foreground mt-1">
                After R&P: {formatNumber(Number(data.totalAfterRP))} {defaultCurrency}
              </p>
            )}
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <p className="text-muted-foreground">
              This is the total balance across all your accounts converted to your default currency.
            </p>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
