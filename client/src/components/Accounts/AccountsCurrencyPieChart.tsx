"use client";

import { useEffect, useState } from "react";
import { Pie, PieChart, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";

import { AccountsService } from "@/services/accounts";
import type { Account } from "@/lib/types";
import { useUserSettings } from "@/contexts/UserSettingsContext";

export function AccountsCurrencyPieChart() {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const { settings } = useUserSettings();

  const locale = settings?.locale || "en-US";
  console.log("User locale:", locale);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      const data = await AccountsService.getAll();
      if (!isMounted) return;
      setAccounts(data);
    };

    fetchData();
    return () => { isMounted = false; };
  }, []);

  if (!accounts) {
    return (
      <Card className="flex flex-col h-full animate-pulse">
        <CardHeader className="pb-0 flex items-center">
          <Skeleton className="h-6 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/4" />
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <Spinner className="h-8 w-8 text-muted-foreground" />
        </CardContent>
        <CardFooter className="flex-col gap-2 text-sm">
          <Skeleton className="h-4 w-1/2 mb-1" />
          <Skeleton className="h-3 w-2/3" />
        </CardFooter>
      </Card>
    );
  }

  const chartData = Object.entries(
    accounts.reduce<Record<string, number>>((acc, account) => {
      acc[account.currency] = (acc[account.currency] || 0) + account.balance;
      return acc;
    }, {})
  )
    .filter(([_, balance]) => balance > 0)
    .map(([currency, balance], i) => ({
      currency,
      balance,
      fill: `hsl(var(--chart-${(i % 5) + 1}))`,
    }));

  const chartConfig = {
    balance: { label: "Balance" },
    ...chartData.reduce(
      (acc, d) => ({
        ...acc,
        [d.currency]: { label: d.currency, color: d.fill },
      }),
      {}
    ),
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-2xl">Balance by Currency</CardTitle>
        <CardDescription className="text-xl">
          Distribution across currencies
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col items-center justify-center gap-4">
        <ChartContainer config={chartConfig} className="w-full h-full">

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>

              <ChartTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length > 0) {
                    const p = payload[0];

                    const name = p.name ?? p.payload?.currency ?? "Unknown";
                    const value = typeof p.value === "number" ? p.value : 0;

                    return (
                      <div className="rounded-md px-2 py-1 shadow bg-card text-card-foreground">
                        <span className="text-sm font-medium">
                          {name}:{" "}
                          {value.toLocaleString(locale, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    );
                  }
                  return null;
                }}
              />



              <Pie
                data={chartData}
                dataKey="balance"
                nameKey="currency"
                labelLine={false}
                isAnimationActive
                animationDuration={1200}
              />

              <Legend
                verticalAlign="bottom"
                align="center"
                content={({ payload }) => (
                  <div className="flex flex-wrap justify-center gap-4 mt-2">
                    {payload?.map((entry: any) => {
                      const currency = entry.payload?.currency ?? entry.value;
                      return (
                        <div key={currency} className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-sm font-medium">
                            {entry.value}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              />

            </PieChart>
          </ResponsiveContainer>

        </ChartContainer>
      </CardContent>

      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Currency diversification <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing distribution of balances grouped by currency (only positive balances)
        </div>
      </CardFooter>
    </Card>
  );
}