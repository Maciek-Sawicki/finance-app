"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateAccountDialog } from "@/components/Accounts/CreateAccountDialog";
import { AccountsService } from "@/services/accounts";
import { useAccounts } from "@/contexts/AccountsContext";

export function QuickActionsCard() {
  const [openAccountDialog, setOpenAccountDialog] = React.useState(false);
  const { refreshAccounts } = useAccounts();

  const handleSaveAccount = async (data: any) => {
    await AccountsService.create(data);
    await refreshAccounts();
    setOpenAccountDialog(false);
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 flex-1">
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="flex items-center justify-center gap-2" onClick={() => setOpenAccountDialog(true)}>
              <Plus className="w-4 h-4" />
              Add Account
            </Button>
            <Button variant="outline" className="flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              Add Transaction
            </Button>
            <Button variant="outline" className="flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              Add Recurring Payment
            </Button>
            <Button variant="outline" className="flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              Add Budget
            </Button>
            <Button variant="outline" className="flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              Add Category
            </Button>
          </div>

          <div className="flex-1" /> 
        </CardContent>
      </Card>


      <CreateAccountDialog
        open={openAccountDialog}
        onClose={() => setOpenAccountDialog(false)}
        onSave={handleSaveAccount}
      />
    </>
  );
}
