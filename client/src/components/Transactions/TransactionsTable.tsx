"use client";

import { useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type SortingState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Transaction } from "@/lib/types";
import { TransactionsService } from "@/services/transactions";
import { CategoriesService } from "@/services/categories";
import type { Category } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type TransactionsTableProps = {
  refreshSignal?: number;
  accountId?: string;
  onUpdated?: () => void;
};

export const TransactionsTable = ({
  refreshSignal,
  accountId,
  onUpdated,
}: TransactionsTableProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(20);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const fetchTransactions = async () => {
    const params: any = {};
    if (accountId) params.accountId = accountId;
    if (selectedCategoryId) params.categoryId = selectedCategoryId;

    const data = await TransactionsService.getAll(params);
    setTransactions(data);
  };

  useEffect(() => {
    fetchTransactions();
  }, [refreshSignal, accountId, selectedCategoryId]);

  useEffect(() => {
    CategoriesService.getAll().then(setCategories);
  }, []);

  const handleToggleSettled = async (transactionId: string, newValue: boolean) => {
    await TransactionsService.update(transactionId, { settled: newValue });
    fetchTransactions();
    onUpdated?.();
  };

  const handleToggleExclude = async (transactionId: string, newValue: boolean) => {
    await TransactionsService.update(transactionId, { exclude: newValue });
    fetchTransactions();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    await TransactionsService.delete(id);
    fetchTransactions();
    onUpdated?.();
  };

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: "date",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      ),
      cell: (info) => new Date(info.getValue<string>()).toLocaleDateString("pl-PL"),
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Amount <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const value = row.getValue<number>("amount");
        const type = row.original.type;
        const currency = row.original.accountId?.currency ?? "USD";

        const isIncome = type === "income";
        const sign = isIncome ? "+" : "-";
        const colorClass = isIncome ? "text-green-500" : "text-red-500";

        return (
          <div className={`font-semibold ${colorClass}`}>
            {sign}
            {Math.abs(value).toLocaleString("en-US", {
              style: "currency",
              currency,
            })}
          </div>
        );
      },
    },
    { accessorKey: "type", header: "Type" },
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
      cell: ({ row }) => (
        <Switch
          checked={row.original.settled}
          onCheckedChange={(checked) => handleToggleSettled(row.original._id, checked)}
        />
      ),
    },
    {
      accessorKey: "exclude",
      header: "Exclude",
      cell: ({ row }) => (
        <Switch
          checked={row.original.exclude}
          onCheckedChange={(checked) => handleToggleExclude(row.original._id, checked)}
        />
      ),
    },
    { accessorKey: "description", header: "Description" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleDelete(row.original._id)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const table = useReactTable({
    data: transactions,
    columns,
    state: { sorting, pagination: { pageIndex, pageSize } },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: (updater) => {
      const state = typeof updater === "function" ? updater({ pageIndex, pageSize }) : updater;
      setPageIndex(state.pageIndex);
    },
  });

  const pageCount = table.getPageCount();

  return (
    <div>

      <div className="p-4 rounded-md mb-4">
        <label className="block text-sm font-medium mb-2">Category:</label>
        <Select
          value={selectedCategoryId ?? "all"}
          onValueChange={(val) => setSelectedCategoryId(val === "all" ? null : val)}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {categories.some((c) => c.favorite) && (
              <>
                <Separator className="my-1" />
                {categories
                  .filter((c) => c.favorite)
                  .map((cat) => (
                    <SelectItem key={cat._id} value={cat._id}>
                      <div className="flex items-center gap-2">
                        {cat.icon && (
                          <span className="text-lg">{cat.icon}</span>
                        )}
                        <span>{cat.name}</span>
                      </div>
                    </SelectItem>
                  ))}
              </>
            )}

            {categories.some((c) => !c.favorite) && (
              <>
                <Separator className="my-1" />
                {categories
                  .filter((c) => !c.favorite)
                  .map((cat) => (
                    <SelectItem key={cat._id} value={cat._id}>
                      <div className="flex items-center gap-2">
                        {cat.icon && (
                          <span className="text-lg">{cat.icon}</span>
                        )}
                        <span>{cat.name}</span>
                      </div>
                    </SelectItem>
                  ))}
              </>
            )}
          </SelectContent>
        </Select>

      </div>

      <div>
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
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end py-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => table.previousPage()}
                className={table.getCanPreviousPage() ? "" : "opacity-50 pointer-events-none"}
              />
            </PaginationItem>
            {Array.from({ length: table.getPageCount() }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  onClick={() => table.setPageIndex(i)}
                  isActive={table.getState().pagination.pageIndex === i}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => table.nextPage()}
                className={table.getCanNextPage() ? "" : "opacity-50 pointer-events-none"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
