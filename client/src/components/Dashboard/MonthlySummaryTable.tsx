"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardService } from "@/services/dashboard";
import type { MonthlySummaryData, MonthlySummaryItem } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function MonthlySummaryTable() {
  const [data, setData] = useState<MonthlySummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await DashboardService.getMonthlySummary("USD");
        setData(res);
        const years = Object.keys(res.monthlySummary).map((m) => m.slice(0, 4));
        const maxYear = Math.max(...years.map(Number)).toString();
        setSelectedYear(maxYear);
      } catch (err) {
        console.error("Error fetching monthly summary:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const availableYears = useMemo(() => {
    if (!data) return [];
    const years = Object.keys(data.monthlySummary).map((m) => m.slice(0, 4));
    return Array.from(new Set(years)).sort((a, b) => Number(b) - Number(a));
  }, [data]);

  const months = useMemo(() => {
    if (!data || !selectedYear) return [];
    return Object.keys(data.monthlySummary)
      .filter((m) => m.startsWith(selectedYear))
      .sort();
  }, [data, selectedYear]);

  const metrics = ["totalIncome", "totalExpense", "profit", "e_i_ratio"];

  const formatCurrency = (v: number) =>
    v.toLocaleString("en-US", { style: "currency", currency: data?.targetCurrency || "USD", maximumFractionDigits: 2 });

  const formatPercent = (v: number | null) => (v !== null ? `${v.toFixed(2)}%` : "—");

  if (loading) {
    return (
      <Card className="p-4">
        <CardContent className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="overflow-x-auto">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <CardTitle className="text-2xl font-semibold">
          Monthly Financial Summary ({data.targetCurrency})
        </CardTitle>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((y) => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="sticky left-0 bg-muted z-10">Month</TableHead>
              {metrics.map((metric) => (
                <TableHead key={metric} className="text-right capitalize">
                  {metric === "e_i_ratio" ? "E/I Ratio" : metric.replace(/([A-Z])/g, " $1")}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {months.map((month) => {
              const item: MonthlySummaryItem | undefined = data.monthlySummary[month];
              return (
                <TableRow key={month}>
                  <TableCell className="font-medium sticky left-0 bg-background z-10">
                    {new Date(month + "-01").toLocaleString("en-US", { month: "short", year: "2-digit" })}
                  </TableCell>
                  {metrics.map((metric) => {
                    if (!item) return <TableCell key={metric} className="text-right">—</TableCell>;
                    let content: string = "";
                    let className = "text-right";

                    if (metric === "e_i_ratio") content = formatPercent(item.e_i_ratio);
                    else content = formatCurrency(item[metric as keyof MonthlySummaryItem] as number);

                    if (metric === "profit") {
                      const profitValue = item.profit;
                      className += profitValue > 0 ? " text-green-500 font-semibold" : profitValue < 0 ? " text-red-500 font-semibold" : "";
                    }

                    return (
                      <TableCell key={metric} className={className}>
                        {content}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
