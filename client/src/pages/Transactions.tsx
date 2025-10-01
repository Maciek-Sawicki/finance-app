import { useState } from "react";
// import { CreateTransactionDialog } from "@/components/Transactions/CreateTransactionDialog";
// import { Button } from "@/components/ui/button";
// import { TransactionService } from "@/services/transactions";
 import { TransactionsTable} from "@/components/Transactions/TransactionsTable"
import {Card} from "@/components/ui/card"

export default function Accounts() {
  //const [createOpen, setCreateOpen] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);

  const triggerRefresh = () => setRefreshSignal(prev => prev + 1);


  return (
    <div className="w-full h-full flex-col justify-center items-center p-10">
      {/* <div className="flex justify-end mb-4">
        <Button onClick={() => setCreateOpen(true)}>+ Add Transaction</Button>
      </div> */}
    <Card>
      <TransactionsTable refreshSignal={refreshSignal}/>  
    </Card>
    {/* <CreateTransactionDialog
      open={createOpen}
      onClose={() => setCreateOpen(false)}
      onSave={async (data) => {
        await TransactionService.create(data);
        setCreateOpen(false);
        triggerRefresh();
      }}
    /> */}
    </div>
  )
}