"use client";

import React from "react";
import {
  LayoutDashboard,
  Wallet,
  ChartColumnStacked,
  ArrowRightLeft,
  PiggyBank,
  ChartNoAxesCombined,
  CircleDollarSign,
  Wrench,
  FileDown,
  FileUp,
} from "lucide-react";

import { NavMain } from "@/components/Navigation/NavMain";
import { NavUser } from "@/components/Navigation/NavUser";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { ModeToggle } from "../Theme/mode-toggle";
import { useAuth } from "@/contexts/AuthContext";
import { useAccounts } from "@/contexts/AccountsContext";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> { }

export const AppSidebar: React.FC<AppSidebarProps> = (props) => {
  const { user, loading } = useAuth();
  const { accounts } = useAccounts();

  if (loading) {
    return (
      <Sidebar variant="inset" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <Skeleton className="h-10 w-full rounded-md animate-pulse" />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="space-y-2 p-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-md animate-pulse" />
          ))}
        </SidebarContent>

        <SidebarFooter className="space-y-2 p-2">
          <Skeleton className="h-10 w-full rounded-md animate-pulse" />
          <Skeleton className="h-10 w-full rounded-md animate-pulse" />
        </SidebarFooter>
      </Sidebar>
    );
  }

  if (!user) return <div className="p-4 text-sm text-muted-foreground">Not authenticated</div>;

  const data = {
    navMain: [
      {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
      },
      {
        title: "Accounts",
        url: "/accounts",
        icon: Wallet,
        items: accounts.map(acc => ({ title: acc.name, url: `/accounts/${acc._id}` })),
      },
      {
        title: "Categories",
        url: "/categories",
        icon: ChartColumnStacked,
      },
      {
        title: "Transactions",
        url: "/transactions/all",
        icon: ArrowRightLeft,
      },
      {
        title: "Budgets",
        url: "/budgets",
        icon: PiggyBank,
      },
      {
        title: "Declarations",
        url: "/declarations",
        icon: Wrench,
        items: [
          { title: "Accounts", url: "/accounts/all" },
          { title: "Categories", url: "/categories/all" },
          { title: "Budgets", url: "/budgets/all" },
          { title: "Recurring Transactions", url: "/recurring-transactions" },
        ],
      },
      {
        title: "Export Data",
        url: "/export",
        icon: FileDown,
        items: [{ title: "Export", url: "/export" }],
      },
      {
        title: "Import Data",
        url: "/import",
        icon: FileUp,
        items: [{ title: "Import", url: "/import" }],
      },
      {
        title: "Reports",
        url: "/reports",
        icon: ChartNoAxesCombined,
        items: [
          { title: "Overview", url: "/reports/overview" },
          { title: "Income & Expenses", url: "/reports/income-expenses" },
          { title: "Categories", url: "/reports/categories" },
        ],
      },
    ],
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <CircleDollarSign className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Cashora</span>
                  <span className="truncate text-xs">Finance</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>

      <SidebarFooter>
        <ul>
          <li className="p-2"><ModeToggle /></li>
        </ul>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
};
