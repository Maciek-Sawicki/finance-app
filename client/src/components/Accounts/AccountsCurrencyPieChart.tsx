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
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

import { AccountsService } from "@/services/accounts";
import type { Account } from "@/lib/types";

export function AccountsCurrencyPieChart() {
  const [accounts, setAccounts] = useState<Account[] | null>(null);

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

  // jeśli dane jeszcze nie przyszły, nic nie renderujemy
  if (!accounts) return null; // albo loader <div>Loading...</div>

  // grupowanie po walucie
  const currencyMap = accounts.reduce<Record<string, number>>((acc, account) => {
    acc[account.currency] = (acc[account.currency] || 0) + account.balance;
    return acc;
  }, {});

  const chartData = Object.entries(currencyMap).map(([currency, balance], i) => ({
    currency,
    balance,
    fill: `hsl(var(--chart-${(i % 12) + 1}))`,
  }));

  
  const formatValue = (value: number) =>
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });


    const chartConfig = {
      balance: { label: "Balance" },
      ...chartData.reduce(
        (acc, d) => ({
          ...acc,
          [d.currency]: {
            label: d.currency, // 👈 tylko waluta
            color: d.fill,
          },
        }),
        {}
      ),
    };
    

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-2xl">Balance by Currency</CardTitle>
        <CardDescription className="text-xl">Distribution across currencies</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col items-center justify-center gap-4">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              {/* <ChartTooltip content={<ChartTooltipContent />} /> */}
              <ChartTooltip
  content={({ active, payload }) => {
    if (active && payload && payload.length > 0) {
      const { name, value } = payload[0];
      return (
        <div className="rounded-m px-2 py-1 shadow bg-card text-card-foreground">
          <span className="text-sm font-medium">
            {name}:{" "}
            {value !== undefined
              ? value.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
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
                    {payload?.map((entry: any) => (
                      <div key={entry.value} className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm font-medium">{entry.value}</span>
                      </div>
                    ))}
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
          Showing distribution of balances grouped by currency
        </div>
      </CardFooter>
    </Card>
  );
}
