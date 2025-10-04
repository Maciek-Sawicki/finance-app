import * as React from "react"
import {
  LayoutDashboard,
  Wallet,
  ChartColumnStacked,
  ArrowRightLeft,
  PiggyBank,
  CalendarArrowUp,
  ChartNoAxesCombined,
  CircleDollarSign,
} from "lucide-react"

import { NavMain } from "@/components/Navigation/nav-main"
import { NavUser } from "@/components/Navigation/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar"
import { ModeToggle } from "../Theme/mode-toggle"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard
    },
    {
      title: "Accounts",
      url: "/accounts",
      icon: Wallet,
      isActive: true,
      items: [
        {
          title: "All accounts",
          url: "/accounts/all",
        },
      ],
    },
    {
      title: "Categories",
      url: "/caregories",
      icon: ChartColumnStacked,
      items: [
        {
          title: "All categories",
          url: "/categories/all",
        },
      ],
    },
    {
      title: "Transactions",
      url: "/transactions/all",
      icon: ArrowRightLeft,
      isActive: true,
      items: [
        {
          title: "History",
          url: "/transactions/history",
        },
        {
          title: "Add transaction",
          url: "/transaction/add",
        },
      ],
    },
    {
      title: "Budgets",
      url: "/budgets",
      icon: PiggyBank,
      items: [
        {
          title: "Summary",
          url: "/budgets/summary",
        },
        {
          title: "Add budget",
          url: "/budget/add",
        },
      ],
    },
    {
      title: "Recurring transactions",
      url: "/recuring-transactions",
      icon: CalendarArrowUp,
      items: [
        {
          title: "Add recurring transaction",
          url: "/recuring-transaction/add",
        }
      ],
    },
    {
      title: "Raports",
      url: "/raports",
      icon: ChartNoAxesCombined,
      items: [
        { title: "Overview", url: "/reports/overview" },
        { title: "Income & Expenses", url: "/reports/income-expenses" },
        { title: "Categories", url: "/reports/categories" },
        { title: "Accounts Summary", url: "/reports/accounts" },
        { title: "Cashflow", url: "/reports/cashflow" },
        { title: "Trends", url: "/reports/trends" },
        { title: "Savings", url: "/reports/savings" },
        { title: "Compare Periods", url: "/reports/compare" },
      ],
    },

  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
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
        <ModeToggle />
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
