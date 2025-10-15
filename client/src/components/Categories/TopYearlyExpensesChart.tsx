"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, LabelList, ResponsiveContainer } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { CategoriesService } from "@/services/categories";
import type { YearlyCategoryStats } from "@/lib/types";

export function TopYearlyExpensesChart() {
  const [data, setData] = useState<YearlyCategoryStats | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      const res = await CategoriesService.getTopYearlyCategories("USD", "expense");
      if (!isMounted) return;

      setData(res);

      const years = Object.keys(res.yearlyCategories);
      const currentYear = String(new Date().getFullYear());
      const initialYear = years.includes(currentYear) ? currentYear : years[0];
      setSelectedYear(initialYear);

      setLoading(false);
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
  };

  if (loading || !data || !selectedYear)
    return (
      <Card className="flex flex-col h-full animate-pulse">
        <CardHeader className="pb-0 flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          <Skeleton className="h-8 w-24 rounded-md" />
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

  const rawCategories = data.yearlyCategories[selectedYear] || [];

  const sorted = [...rawCategories].sort((a, b) => b.total - a.total);
  const topN = 10;
  const topCategories = sorted.slice(0, topN);
  const others = sorted.slice(topN);
  const othersSum = parseFloat(others.reduce((acc, a) => acc + a.total, 0).toFixed(2));
  const totalSum = sorted.reduce((acc, c) => acc + c.total, 0);

  const categories = [
    ...topCategories.map((c, i) => ({
      ...c,
      fill: `hsl(var(--chart-${(i % 12) + 1}))`,
    })),
    ...(othersSum > 0
      ? [
        {
          categoryId: "other",
          name: "Other",
          icon: "➕",
          color: "#999999",
          total: othersSum,
          percent: parseFloat(((othersSum / totalSum) * 100).toFixed(2)),
          fill: `hsl(var(--chart-other))`,
        },
      ]
      : []),
  ];

  const chartConfig = {
    total: { label: "Total" },
    ...categories.reduce(
      (acc, c) => ({
        ...acc,
        [c.name]: { label: c.name, color: c.fill },
      }),
      {}
    ),
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader className="pb-4 flex justify-between items-center">
        <div>
          <CardTitle className="text-2xl">Expenses Breakdown</CardTitle>
          <CardDescription className="text-xl text-center">
            {selectedYear} • {data.targetCurrency}
          </CardDescription>
        </div>
        <div className="flex items-start justify-end gap-2 w-full">
          <Select value={selectedYear} onValueChange={handleYearChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(data.yearlyCategories).map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 flex flex-col items-center justify-start gap-4 overflow-hidden">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <ResponsiveContainer width="100%" height={360}>
            <BarChart
              data={categories}
              layout="vertical"
              margin={{ top: 0, right: 30, left: 50, bottom: 0 }}
              barSize={42}
            >
              <XAxis type="number" dataKey="total" hide />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tick={{ fontSize: 16, fontWeight: 500 }}
                tickFormatter={(value) =>
                  value.length > 10 ? value.slice(0, 10) + "…" : value
                }
              />

              <ChartTooltip
                content={<ChartTooltipContent hideLabel />}
                cursor={{ fill: "hsl(var(--muted) / 0.2)" }}
              />

              <Bar dataKey="total" radius={5} isAnimationActive animationDuration={600}>
                <LabelList
                  dataKey="total"
                  content={({ x, y, width, value }: any) => {
                    const isShort = width < 60;
                    const posX = isShort ? x + width + 6 : x + width - 6;
                    const textAnchor = isShort ? "start" : "end";
                    const fill = isShort
                      ? "hsl(var(--foreground))"
                      : "hsl(var(--background))";

                    return (
                      <text
                        x={posX}
                        y={y! + 26}
                        textAnchor={textAnchor}
                        fill={fill}
                        fontSize={16}
                        fontWeight={500}
                      >
                        ${formatCurrency(value)}
                      </text>
                    );
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>

      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Spending overview <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing top yearly expense categories for {selectedYear}
        </div>
      </CardFooter>
    </Card>

  );
}
