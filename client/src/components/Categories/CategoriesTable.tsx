"use client";

import { useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import type { ColumnDef, SortingState } from "@tanstack/react-table";

import { CategoriesService } from "@/services/categories";
import type { Category } from "@/lib/types";

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
import { EditCategoryDialog } from "@/components/Categories/EditCategoryDialog";

type CategoriesTableProps = {
  refreshSignal?: number;
};

export const CategoriesTable = ({ refreshSignal }: CategoriesTableProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchCategories = async () => {
    const data = await CategoriesService.getAll();
    setCategories(data);
  };

  useEffect(() => {
    fetchCategories();
  }, [refreshSignal]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    await CategoriesService.delete(id);
    fetchCategories();
  };

  const startEditing = (category: Category) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const columns: ColumnDef<Category>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "type", header: "Type" },
    {
      accessorKey: "icon",
      header: "Icon",
      cell: (info) => info.getValue<string>() || "-",
    },
    {
      accessorKey: "color",
      header: "Color",
      cell: (info) => (
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: info.getValue<string>() || "transparent" }}
        />
      ),
    },
    {
      accessorKey: "favorite",
      header: "Favorite",
      cell: (info) => (info.getValue<boolean>() ? "⭐" : ""),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (info) => {
        const category = info.row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => startEditing(category)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDelete(category._id)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: categories,
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

      <EditCategoryDialog
        category={editingCategory}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={async (id, data) => {
          await CategoriesService.update(id, data);
          fetchCategories();
        }}
      />
    </>
  );
};
