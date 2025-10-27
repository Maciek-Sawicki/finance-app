"use client";

import * as React from "react";
import { AppSidebar } from "@/components/Navigation/AppSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AccountsProvider } from "@/contexts/AccountsContext";
import { Button } from "@/components/ui/button";
import { PanelLeftOpen } from "lucide-react";

export const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SidebarProvider>
      <AccountsProvider>
        <div className="flex flex-1 h-screen overflow-hidden relative">
          <AppSidebar />
          <SidebarInset className="flex flex-col flex-1 relative">
            <div className="absolute top-1 left-1 z-50">
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="shadow-md bg-background/80 backdrop-blur-sm hover:bg-background"
              >
                <SidebarTrigger>
                  <PanelLeftOpen className="h-5 w-5" />
                </SidebarTrigger>
              </Button>
            </div>
            <main className="flex-1 overflow-y-auto p-4">
              {children}
            </main>
          </SidebarInset>
        </div>
      </AccountsProvider>
    </SidebarProvider>
  );
};
