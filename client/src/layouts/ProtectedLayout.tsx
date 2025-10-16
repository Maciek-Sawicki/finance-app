"use client";

import * as React from "react";
import { AppSidebar } from "@/components/Navigation/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AccountsProvider } from "@/contexts/AccountsContext";

export const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SidebarProvider className="flex flex-col">
      <AccountsProvider>
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>
            <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
          </SidebarInset>
        </div>
      </AccountsProvider>
    </SidebarProvider>

  );
};
