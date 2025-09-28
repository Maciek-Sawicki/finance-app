import { useState } from "react";
import { CreateAccountDialog } from "@/components/Accounts/CreateAccountDialog";
import { Button } from "@/components/ui/button";
import { AccountsService } from "@/services/accounts";
import { AccountsTable } from "@/components/Accounts/AccountsTable"
import {Card} from "@/components/ui/card"

export default function Accounts() {
  const [createOpen, setCreateOpen] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);

  const triggerRefresh = () => setRefreshSignal(prev => prev + 1);


  return (
    <CreateAccountDialog
      open={createOpen}
      onClose={() => setCreateOpen(false)}
      onSave={async (data) => {
        await AccountsService.create(data);
        setCreateOpen(false);
        triggerRefresh();
      }}
    />
  )
}