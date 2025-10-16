"use client";

import { QuickActionsCard } from "@/components/Dashboard/QuickActionsCard";
import { MonthlySummaryTable } from "@/components/Dashboard/MonthlySummaryTable";

export default function Dashboard() {
  return (
    <div className="grid gap-6 p-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-[250px]">
      <div className="col-span-1 row-span-2">
        <QuickActionsCard />
      </div>
      <div className="col-span-1">
        <MonthlySummaryTable />
      </div>
      <div className="col-span-1">
        
      </div>
      <div className="col-span-1 row-span-3">
        
      </div>
      <div className="col-span-1 row-span-3">
        
      </div>
      <div className="col-span-1 row-span-2">
        
      </div>
    </div>
  );
}
