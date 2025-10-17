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

export function AccountSummaryTable() {
  const [data, setData] = useState<AccountSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
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
    <Card className="overflow-x-auto max-w-4xl mx-auto">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <CardTitle className="text-2xl font-semibold">
          Accounts Summary ({data.currency})
        </CardTitle>

        <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="EUR">EUR</SelectItem>
            <SelectItem value="PLN">PLN</SelectItem>
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
                  {acc.originalSettled.toLocaleString("en-US", {
                    style: "currency",
                    currency: acc.currency,
                  })}
                </TableCell>

                <TableCell className="text-right text-muted-foreground">
                  {acc.originalWithRAndP.toLocaleString("en-US", {
                    style: "currency",
                    currency: acc.currency,
                  })}
                </TableCell>

                <TableCell className="text-right font-semibold">
                  {acc.convertedSettled.toLocaleString("en-US", {
                    style: "currency",
                    currency: data.currency,
                  })}
                </TableCell>

                <TableCell
                  className={`text-right font-semibold ${acc.convertedWithRAndP > acc.convertedSettled
                      ? "text-green-500"
                      : acc.convertedWithRAndP < acc.convertedSettled
                        ? "text-red-500"
                        : ""
                    }`}
                >
                  {acc.convertedWithRAndP.toLocaleString("en-US", {
                    style: "currency",
                    currency: data.currency,
                  })}
                </TableCell>
              </TableRow>
            ))}

            <TableRow className="bg-muted/40 font-bold">
              <TableCell>Total</TableCell>
              <TableCell />
              <TableCell />
              <TableCell className="text-right">
                {data.total.toLocaleString("en-US", {
                  style: "currency",
                  currency: data.currency,
                })}
              </TableCell>
              <TableCell className="text-right">
                {data.totalAfterRAndP.toLocaleString("en-US", {
                  style: "currency",
                  currency: data.currency,
                })}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
