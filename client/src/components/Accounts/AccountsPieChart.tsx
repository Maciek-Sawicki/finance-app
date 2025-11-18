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
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

import { AccountsService } from "@/services/accounts";
import type { Account } from "@/lib/types";
import { useUserSettings } from "@/contexts/UserSettingsContext";

export function AccountsPieChart() {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const { settings } = useUserSettings();

  const userCurrency = settings?.defaultCurrency ?? "USD";
  const locale = settings?.locale ?? "en-US";

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      const data = await AccountsService.getAll(userCurrency); 
      if (!isMounted) return;
      setAccounts(data);
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [userCurrency]);

  if (!accounts)
    return (
      <Card className="flex flex-col h-full animate-pulse">
        <CardHeader className="pb-0 flex items-center">
          <Skeleton className="h-6 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/4" />
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <Spinner className="size-8 text-muted-foreground" />
        </CardContent>
        <CardFooter className="flex-col gap-2 text-sm">
          <Skeleton className="h-4 w-1/2 mb-1" />
          <Skeleton className="h-3 w-2/3" />
        </CardFooter>
      </Card>
    );

  const sorted = [...accounts].sort(
    (a, b) => (b.convertedBalance ?? 0) - (a.convertedBalance ?? 0)
  );
  const top4 = sorted.slice(0, 4);
  const others = sorted.slice(4);
  const othersSum = parseFloat(
    others.reduce((acc, a) => acc + (a.convertedBalance ?? 0), 0).toFixed(2)
  );

  const chartData = [
    ...top4.map((a, i) => ({
      account: a.name,
      balance: a.convertedBalance ?? 0,
      fill: `hsl(var(--chart-${(i % 12) + 1}))`,
    })),
    ...(othersSum > 0
      ? [
          {
            account: "Other",
            balance: othersSum,
            fill: `hsl(var(--chart-5))`,
          },
        ]
      : []),
  ];

  const chartConfig = {
    balance: { label: "Balance" },
    ...chartData.reduce(
      (acc, d) => ({
        ...acc,
        [d.account]: { label: d.account, color: d.fill },
      }),
      {}
    ),
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-2xl">Balance Distribution</CardTitle>
        <CardDescription className="text-xl">Top accounts</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col items-center justify-center gap-4">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <ChartTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length > 0) {
                    const { name, value } = payload[0];
                    return (
                      <div className="rounded-m px-2 py-1 shadow bg-card text-card-foreground">
                        <span className="text-sm font-medium">
                          {name}:{" "}
                          {typeof value === "number"
                            ? value.toLocaleString(locale, {
                                style: "currency",
                                currency: userCurrency,
                                maximumFractionDigits: 2,
                              })
                            : "-"}
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
                nameKey="account"
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
                      const balance =
                        chartData.find((d) => d.account === entry.value)?.balance ?? 0;
                      return (
                        <div key={entry.value} className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-sm font-medium">
                            {entry.value}:{" "}
                            {balance.toLocaleString(locale, {
                              style: "currency",
                              currency: userCurrency,
                              maximumFractionDigits: 2,
                            })}
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
          Portfolio diversification <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing top 4 accounts and the rest as "Other"
        </div>
      </CardFooter>
    </Card>
  );
}
