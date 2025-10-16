"use client";

import { TopYearlyExpensesChart } from "@/components/Categories/TopYearlyExpensesChart";
import { TopYearlyIncomeChart } from "@/components/Categories/TopYearlyIncomeChart";
import { ExpensesTable } from "@/components/Categories/ExpensesTable";
import { IncomeTable } from "@/components/Categories/IncomeTable";
import { StackedExpensesChart } from "@/components/Categories/ExpensesChart";
import { StackedIncomeChart } from "@/components/Categories/IncomeChart";


export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Categories Dashboard</h1>
        <p className="text-muted-foreground">Overview of your income and expenses by category.</p>
      </div>
      <div>
        <h2 className="text-2xl font-bold">Expenses</h2>
      </div>
      <div className="grid gap-x-6 gap-y-2 md:grid-cols-1 lg:grid-cols-3 items-start">
        <div className="col-span-1 h-[798px]">
          <TopYearlyExpensesChart />
        </div>
        <div className="col-span-2 row-span-3">
          <ExpensesTable />
        </div>
        <div className="col-span-3">
          <StackedExpensesChart />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold">Income</h2>
      </div>

      <div className="grid gap-x-6 gap-y-2 md:grid-cols-1 lg:grid-cols-3 items-start">
        <div className="col-span-1 h-[524px]">
          <TopYearlyIncomeChart />
        </div>
        <div className="col-span-2 row-span-3">
          <IncomeTable />
        </div>
        <div className="col-span-3">
          <StackedIncomeChart />
        </div>
      </div>
    </div>

  );
}
