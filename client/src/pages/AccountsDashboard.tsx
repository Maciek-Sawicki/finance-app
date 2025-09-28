"use client";

import { AccountsPieChart } from "@/components/Accounts/AccountsPieChart";
import { DefaultAccountCard } from "@/components/Accounts/DefaultAccount";
import { TotalBalanceCard } from "@/components/Accounts/TotalBalance";
import { AccountsCurrencyPieChart } from "@/components/Accounts/AccountsCurrencyPieChart";
import { TotalBalanceByCurrencyCard } from "@/components/Accounts/TotalBalanceByCurrencyCard";

export default function Dashboard() {
  return (
    <div className="grid gap-6 p-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-[250px]">
      <div className="col-span-1">
        <TotalBalanceCard />
      </div>
      <div className="col-span-1">
        <DefaultAccountCard />
      </div>
      <div className="col-span-1 row-span-3">
        <AccountsPieChart /> 
      </div>
      <div className="col-span-1 row-span-2">
        <TotalBalanceByCurrencyCard />
      </div>
      <div className="col-span-1 row-span-3">
        <AccountsCurrencyPieChart /> 
      </div>
    </div>
  );
}
