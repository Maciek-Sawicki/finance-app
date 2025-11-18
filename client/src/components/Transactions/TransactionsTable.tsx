"use client";

import { useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
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
import { ArrowUpDown, MoreHorizontal, Loader2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Transaction, Category, Account } from "@/lib/types";
import { TransactionsService } from "@/services/transactions";
import { CategoriesService } from "@/services/categories";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { EditTransactionDialog } from "@/components/Transactions/EditTransactionDialog";
import { useUserSettings } from "@/contexts/UserSettingsContext";

type TransactionsTableProps = {
  refreshSignal?: number;
  accountId?: string;
  accounts?: Account[];
  onUpdated?: () => void;
};

export const TransactionsTable = ({
  refreshSignal,
  accountId,
  accounts = [],
  onUpdated,
}: TransactionsTableProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "date", desc: true },
  ]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { settings } = useUserSettings();
  const userCurrency = settings?.defaultCurrency ?? "USD";
  const locale = settings?.locale ?? "pl-PL"; 

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pageIndex + 1,
        limit: pageSize,
      };
      if (accountId) params.accountId = accountId;
      if (selectedCategoryId) params.categoryId = selectedCategoryId;

      const res = await TransactionsService.getAll(params);
      setTransactions(res.data || []);
      setTotalPages(res.totalPages || 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [pageIndex, accountId, selectedCategoryId, refreshSignal, pageSize]);

  useEffect(() => {
    CategoriesService.getAll().then(setCategories);
  }, []);

  const handleToggleSettled = async (
    transactionId: string,
    newValue: boolean
  ) => {
    await TransactionsService.update(transactionId, { settled: newValue });
    fetchTransactions();
    onUpdated?.();
  };

  const isRecentlyUpdated = (updatedAt: string) => {
    const minutes = 10;
    return new Date().getTime() - new Date(updatedAt).getTime() < minutes * 60_000;
  };

  const handleToggleExclude = async (
    transactionId: string,
    newValue: boolean
  ) => {
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
      id: "lp",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === "asc")
          }
        >
          LP <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => pageIndex * pageSize + row.index + 1,
    },
    {
      accessorKey: "date",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === "asc")
          }
        >
          Date <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      ),
      cell: (info) =>
        new Date(info.getValue<string>()).toLocaleDateString("pl-PL"),
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === "asc")
          }
        >
          Amount <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const value = row.getValue<number>("amount");
        const type = row.original.type;
        const isIncome = type === "income";
        const colorClass = isIncome ? "text-green-500" : "text-red-500";
    
        return (
          <div className={`font-semibold ${colorClass}`}>
            {isIncome ? "+" : "-"}
            {Math.abs(value).toLocaleString(locale, {
              style: "currency",
              currency: userCurrency,
              maximumFractionDigits: 2,
            })}
          </div>
        );
      },
    },
    { accessorKey: "type", header: () => <span>Type</span> },
    {
      accessorKey: "categoryId",
      header: () => <span>Category</span>,
      cell: (info) => info.getValue<any>()?.name ?? "-",
    },
    {
      accessorKey: "accountId",
      header: () => <span>Account</span>,
      cell: (info) => info.getValue<any>()?.name ?? "-",
    },
    {
      accessorKey: "settled",
      header: () => <span>Settled</span>,
      cell: ({ row }) => (
        <Switch
          checked={row.original.settled}
          onCheckedChange={(checked) =>
            handleToggleSettled(row.original._id, checked)
          }
        />
      ),
    },
    {
      accessorKey: "exclude",
      header: () => <span>Exclude</span>,
      cell: ({ row }) => (
        <Switch
          checked={row.original.exclude}
          onCheckedChange={(checked) =>
            handleToggleExclude(row.original._id, checked)
          }
        />
      ),
    },
    { accessorKey: "description", header: () => <span>Description</span> },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === "asc")
          }
        >
          Last Modified <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      ),
      cell: ({ getValue }) =>
        new Date(getValue<string>()).toLocaleString("pl-PL"),
    },
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
            <DropdownMenuLabel><span>Actions</span></DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                setEditingTransaction(row.original);
                setEditDialogOpen(true);
              }}
            >
              Edit
            </DropdownMenuItem>
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
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div>
      <div className="p-4 rounded-md mb-4 flex justify-between items-end">
        <div>
          <label className="block text-sm font-medium mb-2">Category:</label>
          <Select
            value={selectedCategoryId ?? "all"}
            onValueChange={(val) =>
              setSelectedCategoryId(val === "all" ? null : val)
            }
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <Separator className="my-1" />

              {categories
                .filter((cat) => cat.type === "expense" && cat.favorite)
                .map((cat) => (
                  <SelectItem key={cat._id} value={cat._id}>
                    {cat.icon && <span className="mr-2">{cat.icon}</span>}
                    {cat.name}
                  </SelectItem>
                ))}

              <Separator className="my-1" />

              {categories
                .filter((cat) => cat.type === "income" && cat.favorite)
                .map((cat) => (
                  <SelectItem key={cat._id} value={cat._id}>
                    {cat.icon && <span className="mr-2">{cat.icon}</span>}
                    {cat.name}
                  </SelectItem>
                ))}

              <Separator className="my-1" />

              {categories
                .filter((cat) => cat.type === "expense" && !cat.favorite)
                .map((cat) => (
                  <SelectItem key={cat._id} value={cat._id}>
                    {cat.icon && <span className="mr-2">{cat.icon}</span>}
                    {cat.name}
                  </SelectItem>
                ))}

              <Separator className="my-1" />

              {categories
                .filter((cat) => cat.type === "income" && !cat.favorite)
                .map((cat) => (
                  <SelectItem key={cat._id} value={cat._id}>
                    {cat.icon && <span className="mr-2">{cat.icon}</span>}
                    {cat.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-right">
            Rows per page:
          </label>
          <Select
            value={pageSize.toString()}
            onValueChange={(val) => {
              setPageIndex(0);
              setPageSize(parseInt(val));
            }}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="20" />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 40, 60, 100].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Table className="force-last-row-border">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="px-4 py-2">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell, cellIndex) => (
                    <TableCell
                      key={cell.id}
                      className={`px-4 py-2 ${cellIndex === 0 && isRecentlyUpdated(row.original.updatedAt)
                        ? "border-l-4 border-l-primary"
                        : ""
                        }`}
                    >
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
      )}
      <div className="flex justify-end py-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => pageIndex > 0 && setPageIndex(pageIndex - 1)}
                className={`${pageIndex === 0 ? "opacity-50 pointer-events-none" : ""
                  } cursor-pointer`}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  onClick={() => setPageIndex(i)}
                  isActive={pageIndex === i}
                  className="cursor-pointer"
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  pageIndex < totalPages - 1 && setPageIndex(pageIndex + 1)
                }
                className={`${pageIndex === totalPages - 1
                  ? "opacity-50 pointer-events-none"
                  : ""
                  } cursor-pointer`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {editingTransaction && (
        <EditTransactionDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          transaction={editingTransaction}
          accounts={accounts}
          categories={categories}
          onSave={async (id, data) => {
            await TransactionsService.update(id, data);
            fetchTransactions();
            setEditDialogOpen(false);
          }}
        />
      )}
    </div>
  );
};
