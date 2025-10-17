"use client";

import { useEffect, useState } from "react";
import { TransactionsService } from "@/services/transactions";
import type { Transaction } from "@/lib/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function LastTransactionsTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await TransactionsService.getLastTransactions(10);
        setTransactions(res);
      } catch (err) {
        console.error("Error fetching transactions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-GB");
  };

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

  return (
    <Card className="overflow-x-auto">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <CardTitle className="text-2xl font-semibold">
        Recent Transactions 
        </CardTitle>
      </CardHeader>

      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            No transactions found
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Account</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx._id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(tx.date)}
                  </TableCell>

                  <TableCell>
                    <div className="inline-flex items-center gap-2">
                      {tx.categoryId?.icon && <span>{tx.categoryId.icon}</span>}
                      <span className="truncate max-w-[120px]">
                        {tx.categoryId?.name}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="inline-flex items-center gap-2">
                      {tx.accountId?.icon && <span>{tx.accountId.icon}</span>}
                      <span className="truncate max-w-[120px]">
                        {tx.accountId?.name}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell
                    className={cn(
                      "text-right font-semibold whitespace-nowrap",
                      tx.type === "income"
                        ? "text-green-500"
                        : "text-red-500"
                    )}
                  >
                    {tx.type === "income" ? "+" : "-"}
                    {tx.amount.toLocaleString("en-US")}{" "}
                    {tx.accountId?.currency}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>

          </Table>
        )}
      </CardContent>
    </Card>
  );
}
