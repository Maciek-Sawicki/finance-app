"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import type { Budget } from "@/lib/types";

type Props = {
  budget: Budget;
  currency: string;
  locale: string;
};

export const BudgetCard = ({ budget, currency, locale }: Props) => {
  const converted = budget.convertedAmount ?? budget.amount;
  const spent = budget.spent ?? 0;

  const progress = converted > 0 ? (spent / converted) * 100 : 0;
  const isOver = spent > converted;

  return (
    <Card className="p-4 shadow-sm border rounded-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {budget.categoryId?.icon && <span>{budget.categoryId.icon}</span>}
          <CardTitle>{budget.categoryId?.name ?? "Unknown category"}</CardTitle>
        </div>

        <CardDescription className="text-sm text-muted-foreground mt-1">
          {new Date(budget.startDate).toLocaleDateString(locale)} –{" "}
          {new Date(budget.endDate).toLocaleDateString(locale)}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">

        <p className="text-xs text-muted-foreground">
          Original budget:{" "}
          <span className="font-semibold">
            {new Intl.NumberFormat(locale, {
              style: "currency",
              currency: budget.currency,
            }).format(budget.amount)}
          </span>
        </p>

        <div>
          <div className="flex justify-between mb-1 text-sm">
            <span>
              {new Intl.NumberFormat(locale, {
                style: "currency",
                currency,
              }).format(spent)}
            </span>

            <span>
              {new Intl.NumberFormat(locale, {
                style: "currency",
                currency,
              }).format(converted)}
            </span>
          </div>

          <ProgressBar
            value={progress}
            color={
              progress < 70
                ? "progress-bar-low" 
                : progress < 100
                  ? "progress-bar-medium" 
                  : "progress-bar-high" 
            }
          />



          {isOver && (
            <p className="text-xs text-red-500 font-semibold mt-1">
              Overspent by{" "}
              {new Intl.NumberFormat(locale, { style: "currency", currency }).format(
                spent - converted
              )}
            </p>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p>Type: <span className="font-medium capitalize">{budget.type}</span></p>
          <p>Carry over: {budget.carryOver ? "Yes" : "No"}</p>
          <p>Status: <span className="capitalize">{budget.status}</span></p>
        </div>
      </CardContent>
    </Card>
  );
};
