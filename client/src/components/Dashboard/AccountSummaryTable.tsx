"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountsService } from "@/services/accounts";
import type { AccountSummaryResponse } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useUserSettings } from "@/contexts/UserSettingsContext";

export function AccountSummaryTable() {
  const [data, setData] = useState<AccountSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const { settings } = useUserSettings();

  const favoriteCurrencies = settings?.favoriteCurrencies ?? ["USD", "EUR", "PLN"];
  const locale = settings?.locale ?? "en-US";
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);

  const formatCurrency = (value: number, currency: string) => {
    try {
      return value.toLocaleString(locale, {
        style: "currency",
        currency,
      });
    } catch {
      return `${currency} ${value.toFixed(2)}`;
    }
  };

  useEffect(() => {
    if (!settings) return;

    const preferred =
      settings.defaultCurrency ??
      settings.favoriteCurrencies?.[0] ??
      "USD";

    setSelectedCurrency(preferred);
  }, [settings]);

  useEffect(() => {
    if (!selectedCurrency) return; 

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await AccountsService.getSummary(selectedCurrency);
        setData(res);
      } catch (err) {
        console.error("Error fetching account summary:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCurrency]);

  if (!selectedCurrency || loading) {
    return (
      <Card className="overflow-x-auto max-w-4xl mx-auto p-4">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-2xl font-semibold">
            Accounts Summary ({selectedCurrency ?? "..."})
          </CardTitle>

          {selectedCurrency && (
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>

              <SelectContent>
                {favoriteCurrencies.map((cur) => (
                  <SelectItem key={cur} value={cur}>
                    {cur}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardHeader>

        <CardContent className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <Skeleton className="h-5 w-[160px]" />

              <span className="font-medium text-muted-foreground">
                {selectedCurrency ? formatCurrency(0, selectedCurrency) : "..."}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="overflow-x-auto max-w-4xl mx-auto">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <CardTitle className="text-2xl font-semibold">
          Accounts Summary ({data.currency})
        </CardTitle>

        <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>

          <SelectContent>
            {favoriteCurrencies.map((cur) => (
              <SelectItem key={cur} value={cur}>
                {cur}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Account</TableHead>
              <TableHead className="text-right">Original (Settled)</TableHead>
              <TableHead className="text-right">Original (R&amp;P)</TableHead>
              <TableHead className="text-right">Converted (Settled)</TableHead>
              <TableHead className="text-right">Converted (R&amp;P)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.accounts.map((acc) => (
              <TableRow key={acc.id}>
                <TableCell className="font-medium max-w-[160px] truncate">
                  {acc.name}
                  <div className="text-xs text-muted-foreground">
                    {acc.currency} {acc.isDefault && "(default)"}
                  </div>
                </TableCell>

                <TableCell className="text-right text-muted-foreground">
                  {formatCurrency(acc.originalSettled, acc.currency)}
                </TableCell>

                <TableCell className="text-right text-muted-foreground">
                  {formatCurrency(acc.originalWithRAndP, acc.currency)}
                </TableCell>

                <TableCell className="text-right font-semibold">
                  {formatCurrency(acc.convertedSettled, data.currency)}
                </TableCell>

                <TableCell
                  className={`text-right font-semibold ${
                    acc.convertedWithRAndP > acc.convertedSettled
                      ? "text-green-500"
                      : acc.convertedWithRAndP < acc.convertedSettled
                        ? "text-red-500"
                        : ""
                  }`}
                >
                  {formatCurrency(acc.convertedWithRAndP, data.currency)}
                </TableCell>
              </TableRow>
            ))}

            <TableRow className="bg-muted/40 font-bold">
              <TableCell>Total</TableCell>
              <TableCell />
              <TableCell />
              <TableCell className="text-right">
                {formatCurrency(data.total, data.currency)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(data.totalAfterRAndP, data.currency)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
