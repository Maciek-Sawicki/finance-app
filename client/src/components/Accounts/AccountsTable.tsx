"use client";

import { useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { AccountsService } from "@/services/accounts";
import type { Account } from "@/lib/types";
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
import { MoreHorizontal } from "lucide-react";
import { EditAccountDialog } from "@/components/Accounts/EditAccountDialog";

type AccountsTableProps = {
  refreshSignal?: number;
};

export const AccountsTable = ({ refreshSignal }: AccountsTableProps) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchAccounts = async () => {
    const data = await AccountsService.getAll();
    setAccounts(data);
  };

  useEffect(() => {
    fetchAccounts();
  }, [refreshSignal]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you really want to delete this account?")) return;
    await AccountsService.delete(id);
    fetchAccounts();
  };

  const handleSetDefault = async (id: string) => {
    await AccountsService.setDefault(id);
    fetchAccounts();
  };

  const startEditing = (account: Account) => {
    setEditingAccount(account);
    setDialogOpen(true);
  };

  const columns: ColumnDef<Account>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "type", header: "Type" },
    {
      accessorKey: "balance",
      header: "Balance",
      cell: (info) => (
        <span className="font-bold">
          {info.getValue<number>().toFixed(2)}
        </span>
      ),
    },
    { accessorKey: "currency", header: "Currency" },
    { accessorKey: "icon", header: "Icon" },
    {
      accessorKey: "description",
      header: "Description",
      cell: (info) => info.getValue<string>() || "-",
    },
    {
      accessorKey: "isDefault",
      header: "Default",
      cell: (info) => (info.getValue<boolean>() ? "Default" : ""),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (info) => {
        const account = info.row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => startEditing(account)}>
                Edit
              </DropdownMenuItem>
              {!account.isDefault && (
                <DropdownMenuItem onClick={() => handleSetDefault(account._id)}>
                  Set as Default
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDelete(account._id)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: accounts,
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
      <EditAccountDialog
        account={editingAccount}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={async (id, data) => {
          await AccountsService.update(id, data);
          fetchAccounts();
        }}
      />
    </>
  );
};

