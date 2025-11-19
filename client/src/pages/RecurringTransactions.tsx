"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RecurringTransactionsTable } from "@/components/RecurringTransactions/RecurringTransactionsTable";
import { CreateRecurringTransactionDialog } from "@/components/RecurringTransactions/CreateRecurringTransactionDialog";
import { EditRecurringTransactionDialog } from "@/components/RecurringTransactions/EditRecurringTransactionDialog";
import { useRecurringTransactions } from "@/contexts/RecurringTransactionsContext";

export default function RecurringTransactionsPage() {
  const { createRecurringTransaction, updateRecurringTransaction, deleteRecurringTransaction, toggleRecurringTransaction } =
    useRecurringTransactions();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    setEditOpen(true);
  };

  const handleCreateSave = async (data: any) => {
    await createRecurringTransaction(data);
    setCreateOpen(false);
  };

  const handleEditSave = async (id: string, data: any) => {
    await updateRecurringTransaction(id, data);
    setEditOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteRecurringTransaction(id);
  };

  const handleToggle = async (id: string) => {
    await toggleRecurringTransaction(id);
  };

  return (
    <div className="w-full h-full flex-col justify-center items-center p-10">
      <div className="mb-6 w-full flex flex-col md:flex-row md:justify-between md:items-end gap-2">
        <h1 className="text-2xl font-bold">Recurring Transactions</h1>
        <div className="flex justify-end items-center">
          <Button onClick={() => setCreateOpen(true)}>+ Add Recurring Transaction</Button>
        </div>
      </div>

      <Card>
        <RecurringTransactionsTable
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggle={handleToggle}
        />
      </Card>

      <CreateRecurringTransactionDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={handleCreateSave}
      />

      <EditRecurringTransactionDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        transaction={editingTransaction}
        onSave={handleEditSave}
      />
    </div>
  );
}
