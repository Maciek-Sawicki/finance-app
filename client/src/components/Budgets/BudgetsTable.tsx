"use client";

import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import type { Budget } from "@/lib/types";
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

type BudgetsTableProps = {
  budgets: Budget[];
  onEdit?: (budget: Budget) => void;
  onDelete?: (budget: Budget) => void;
  refreshSignal?: number;
  currency?: string;
  locale?: string;
};

export const BudgetsTable = ({
  budgets,
  onEdit,
  onDelete,
  currency = "USD",
  locale = "en-US",
}: BudgetsTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<Budget>[] = [
    {
      accessorKey: "categoryId.name",
      header: "Category",
      cell: (info) => (
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: info.row.original.categoryId?.color ?? "#999" }}
          />
          {info.row.original.categoryId?.name ?? "-"}
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Original Budget",
      cell: (info) => {
        const { amount, currency: originalCurrency } = info.row.original;
        return new Intl.NumberFormat(locale, { style: "currency", currency: originalCurrency }).format(amount);
      },
    },
    
    {
      accessorKey: "convertedAmount",
      header: `Converted (${currency})`,
      cell: (info) => {
        const converted = info.row.original.convertedAmount ?? info.row.original.amount;
        return new Intl.NumberFormat(locale, { style: "currency", currency }).format(converted);
      },
    },
    {
      accessorKey: "spent",
      header: "Spent",
      cell: (info) => {
        const spent = info.row.original.spent ?? 0;
        return new Intl.NumberFormat(locale, { style: "currency", currency }).format(spent);
      },
    },
    {
      accessorKey: "progress",
      header: "Progress",
      cell: (info) => {
        const progress = info.getValue<number>() ?? 0;
        const color =
          progress < 70 ? "text-green-500" : progress < 100 ? "text-yellow-500" : "text-red-500";
        return <span className={`${color} font-medium`}>{progress.toFixed(0)}%</span>;
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: (info) => {
        const type = info.getValue<string>();
        const color = type === "fixed" ? "text-blue-500" : "text-purple-500";
        return <span className={`${color} capitalize`}>{type}</span>;
      },
    },
    {
      accessorKey: "carryOver",
      header: "Carry Over",
      cell: (info) => (info.getValue<boolean>() ? "Yes" : "No"),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (info) => {
        const status = info.getValue<string>();
        const color =
          status === "active" ? "text-blue-600" : status === "completed" ? "text-gray-500" : "text-orange-500";
        return <span className={`${color} capitalize`}>{status}</span>;
      },
    },
    {
      accessorKey: "startDate",
      header: "Period",
      cell: (info) => {
        const { startDate, endDate } = info.row.original;
        return (
          <span className="text-sm text-muted-foreground">
            {new Date(startDate).toLocaleDateString(locale)} - {new Date(endDate).toLocaleDateString(locale)}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: (info) => {
        const budget = info.row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {onEdit && <DropdownMenuItem onClick={() => onEdit(budget)}>Edit</DropdownMenuItem>}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDelete(budget)}>Delete</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: budgets,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: { currency, locale },
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
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
  );
};
