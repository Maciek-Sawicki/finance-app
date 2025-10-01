"use client";

import { useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import type { ColumnDef, SortingState } from "@tanstack/react-table";

import { TransactionsService } from "@/services/transactions";
import type { Transaction } from "@/lib/types";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { Switch } from "@/components/ui/switch";
import { MoreHorizontal } from "lucide-react";
// np. jak chcesz mieć edycję, analogicznie jak z kategoriami
// import { EditTransactionDialog } from "@/components/Transactions/EditTransactionDialog";

type TransactionsTableProps = {
  refreshSignal?: number;
};

export const TransactionsTable = ({ refreshSignal }: TransactionsTableProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  // const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  // const [dialogOpen, setDialogOpen] = useState(false);

  const fetchTransactions = async () => {
    const data = await TransactionsService.getAll();
    setTransactions(data);
  };

  useEffect(() => {
    fetchTransactions();
  }, [refreshSignal]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    await TransactionsService.delete(id);
    fetchTransactions();
  };

  // const startEditing = (transaction: Transaction) => {
  //   setEditingTransaction(transaction);
  //   setDialogOpen(true);
  // };

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: (info) =>
        new Date(info.getValue<string>()).toLocaleDateString("pl-PL"),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row, column }) => {
        const value = row.getValue<number>("amount");
        const currency = row.original.currency;
        const type = row.original.type;

        let color;
        if (type === "income") color = "green";
        else if (type === "expense") color = "red";
    
        return (
          <span
            key={column.id + "_" + row.id}
            className="font-bold"
            style={{ color }}
          >
            {value.toLocaleString("en-US", {
              style: "currency",
              currency,
            })}
          </span>
        );
      },
    },    
    {
      accessorKey: "type",
      header: "Type",
    },
    {
      accessorKey: "categoryId",
      header: "Category",
      cell: (info) => info.getValue<any>()?.name ?? "-",
    },
    {
      accessorKey: "accountId",
      header: "Account",
      cell: (info) => info.getValue<any>()?.name ?? "-",
    },
    {
      accessorKey: "settled",
      header: "Settled",
      cell: ({ row }) => {
        const transaction = row.original;
        const handleToggle = async () => {
          try {
            await TransactionsService.toggleSettled(transaction._id);
            fetchTransactions();
          } catch (err) {
            console.error("Failed to toggle settled:", err);
          }
        };
  
        return (
          <Switch
            checked={transaction.settled}
            onCheckedChange={handleToggle}
          />
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      id: "actions",
      header: "Actions",
      cell: (info) => {
        const transaction = info.row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleDelete(transaction._id)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: transactions,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* 
      <EditTransactionDialog
        transaction={editingTransaction}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={async (id, data) => {
          await TransactionsService.update(id, data);
          fetchTransactions();
        }}
      /> 
      */}
    </>
  );
};
