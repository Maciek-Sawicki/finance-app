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

import { AccountsService } from "@/services/accounts";
import type { Account } from "@/lib/types";

export function AccountsPieChart() {
  const [accounts, setAccounts] = useState<Account[] | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      const data = await AccountsService.getAll();
      if (!isMounted) return;
      setAccounts(data);
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!accounts) return null;

  const sorted = [...accounts].sort((a, b) => b.balance - a.balance);
  const top4 = sorted.slice(0, 4);
  const others = sorted.slice(4);
  const othersSum = parseFloat(
    others.reduce((acc, a) => acc + a.balance, 0).toFixed(2)
  );

  const chartData = [
    ...top4.map((a, i) => ({
      account: a.name,
      balance: a.balance,
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

  const formatCurrency = (value: number) =>
    value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
                          {name}: {typeof value === "number" ? formatCurrency(value) : "-"}
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
          Portfolio diversification <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing top 4 accounts and the rest as "Other"
        </div>
      </CardFooter>
    </Card>
  );
}
