"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoriesService } from "@/services/categories";
import type { MonthlyCategoryStats, MonthlyCategory } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function IncomeTable() {
  const [data, setData] = useState<MonthlyCategoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>(""); 

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await CategoriesService.getTopMonthlyCategories("USD", "income");
        setData(res);

        const years = Object.keys(res.monthlyCategories).map((m) => m.slice(0, 4));
        const maxYear = Math.max(...years.map(Number)).toString();
        setSelectedYear(maxYear);
      } catch (err) {
        console.error("Error fetching monthly categories:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const availableYears = useMemo(() => {
    if (!data) return [];
    const years = Object.keys(data.monthlyCategories).map((m) => m.slice(0, 4));
    return Array.from(new Set(years)).sort((a, b) => Number(b) - Number(a));
  }, [data]);

  const months = useMemo(() => {
    if (!data || !selectedYear) return [];
    return Object.keys(data.monthlyCategories)
      .filter((m) => m.startsWith(selectedYear))
      .sort();
  }, [data, selectedYear]);

  const allCategories = useMemo(() => {
    const cats: Record<string, MonthlyCategory> = {};
    if (!data) return cats;
    months.forEach((month) => {
      data.monthlyCategories[month].forEach((c) => {
        if (!cats[c.categoryId]) cats[c.categoryId] = { ...c };
      });
    });
    return cats;
  }, [data, months]);

  const categoryTotals = useMemo(() => {
    return Object.values(allCategories).map((cat) => {
      let yearTotal = 0;
      months.forEach((month) => {
        const found = data?.monthlyCategories[month].find((c) => c.categoryId === cat.categoryId);
        yearTotal += found ? found.total : 0;
      });
      return {
        ...cat,
        yearTotal,
        avgPerMonth: months.length > 0 ? yearTotal / months.length : 0,
      };
    });
  }, [allCategories, months, data]);

  const formatCurrency = (v: number) =>
    v.toLocaleString("en-US", { style: "currency", currency: data?.targetCurrency || "USD", maximumFractionDigits: 2 });

  const truncateCategoryName = (name: string, maxLength: number) =>
    name.length <= maxLength ? name : name.slice(0, maxLength) + "...";

  if (loading) {
    return (
      <Card className="p-4">
        <CardContent className="space-y-2">
          {[...Array(10)].map((_, i) => (
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
          Monthly Income Breakdown ({data.targetCurrency})
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
              <TableHead className="sticky left-0 bg-muted z-10">Income</TableHead>
              {months.map((m) => (
                <TableHead key={m} className="text-right">
                  {new Date(m + "-01").toLocaleString("en-US", { month: "short", year: "2-digit" })}
                </TableHead>
              ))}
              <TableHead className="text-right font-bold">Year</TableHead>
              <TableHead className="text-right font-bold">Avg / Month</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {categoryTotals.map((cat) => (
              <TableRow key={cat.categoryId}>
                <TableCell className="font-medium sticky left-0 bg-background z-10">
                  <span className="mr-1">{cat.icon}</span> {truncateCategoryName(cat.name, 16)}
                </TableCell>
                {months.map((m) => {
                  const found = data.monthlyCategories[m].find((c) => c.categoryId === cat.categoryId);
                  return (
                    <TableCell key={m} className="text-right">
                      {found ? formatCurrency(found.total) : "—"}
                    </TableCell>
                  );
                })}
                <TableCell className="text-right font-semibold">{formatCurrency(cat.yearTotal)}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatCurrency(cat.avgPerMonth)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
