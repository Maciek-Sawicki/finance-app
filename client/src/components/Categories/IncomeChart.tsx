"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoriesService } from "@/services/categories";
import type { MonthlyCategoryStats } from "@/lib/types";

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
  "hsl(var(--chart-7))",
  "hsl(var(--chart-8))",
  "hsl(var(--chart-9))",
  "hsl(var(--chart-10))",
];
const otherColor = "hsl(var(--chart-other))";

export function StackedIncomeChart() {
  const [data, setData] = useState<MonthlyCategoryStats | null>(null);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await CategoriesService.getTopMonthlyCategories("USD", "income");
        setData(res);
      } catch (err) {
        console.error("Error fetching chart data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const years = useMemo(() => {
    if (!data) return [];
    return Array.from(
      new Set(Object.keys(data.monthlyCategories).map((key) => key.split("-")[0]))
    ).sort();
  }, [data]);

  const processedData = useMemo(() => {
    if (!data) return { chartData: [], categories: [] };

    const months = Object.keys(data.monthlyCategories)
      .filter((key) => key.startsWith(year))
      .sort();

    const yearlyTotals: Record<string, number> = {};
    months.forEach((month) => {
      data.monthlyCategories[month].forEach((c) => {
        yearlyTotals[c.name] = (yearlyTotals[c.name] || 0) + c.total;
      });
    });

    const topCategories = Object.entries(yearlyTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);
    const allNames = Object.keys(yearlyTotals);

    const chartData = months.map((month) => {
      const row: Record<string, number | string> = {
        month: new Date(month + "-01").toLocaleString("en-US", { month: "short" }),
      };
      let otherSum = 0;
      data.monthlyCategories[month].forEach((c) => {
        if (topCategories.includes(c.name)) {
          row[c.name] = c.total;
        } else {
          otherSum += c.total;
        }
      });
      if (otherSum > 0) row["Other"] = otherSum;
      return row;
    });

    const categories = topCategories.map((name, i) => ({
      name,
      color: chartColors[i % chartColors.length],
    }));
    if (allNames.length > 5) {
      categories.push({ name: "Other", color: otherColor });
    }

    return { chartData, categories };
  }, [data, year]);

  if (loading) {
    return (
      <Card className="p-6">
        <CardTitle>Loading chart...</CardTitle>
      </Card>
    );
  }

  return (
    <Card className="p-6 flex flex-col lg:flex-row">
      <div className="flex-1 min-w-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-2xl font-semibold pb-6">Monthly Income Breakdown</CardTitle>
          {years.length > 0 && (
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardHeader>

        <CardContent className="h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={processedData.chartData}
              margin={{ top: 10, right: 10, left: 30, bottom: 0 }} 
            >
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 16, fontWeight: 500 }} />
              <YAxis
                width={60}
                tickFormatter={(v) => "$" + v.toLocaleString()}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 16, fontWeight: 500 }}
              />
              <Tooltip
                formatter={(value: number) => "$" + value.toLocaleString()}
                cursor={{ fill: "rgba(0,0,0,0.05)" }}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
              />
              {processedData.categories.map((cat) => (
                <Bar
                  key={cat.name}
                  dataKey={cat.name}
                  stackId="a"
                  fill={cat.color}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </div>

      <div className="mt-6 lg:mt-0 lg:ml-6 w-full lg:w-56">
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
          Categories
        </h3>
        <ul className="space-y-2">
          {processedData.categories.map((cat) => (
            <li key={cat.name} className="flex items-center space-x-2">
              <div
                className="h-3 w-3 rounded-full border" 
                style={{
                  backgroundColor: cat.color,
                  borderColor: "hsl(var(--border))",
                }}
              />
              <span className="text-sm text-foreground">{cat.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
