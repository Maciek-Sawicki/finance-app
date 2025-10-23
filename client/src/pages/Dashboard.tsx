"use client";

import { QuickActionsCard } from "@/components/Dashboard/QuickActionsCard";
import { MonthlySummaryTable } from "@/components/Dashboard/MonthlySummaryTable";
import { LastTransactionsTable } from "@/components/Dashboard/LastTransactionsTable";
import { AccountSummaryTable } from "@/components/Dashboard/AccountSummaryTable";
import { TotalBalanceCard } from "@/components/Accounts/TotalBalance";
import { DefaultAccountCard } from "@/components/Accounts/DefaultAccount";

export default function Dashboard() {
  return (
    <div className="grid gap-6 p-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-min">
      
      <div className="col-span-1">
        <TotalBalanceCard />
      </div>
      <div className="col-span-1">
        <DefaultAccountCard />
      </div>
      <div className="col-span-1">
        <QuickActionsCard />
      </div>

      <div className="col-span-1 lg:row-span-3">
        <AccountSummaryTable />
      </div>

      <div className="col-span-1">
        <MonthlySummaryTable />
      </div>
      <div className="col-span-1">
      <LastTransactionsTable />
      </div>

    </div>
  );
}
