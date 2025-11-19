"use client";

import type { FC } from "react";
import { useRecurringTransactions } from "@/contexts/RecurringTransactionsContext";
import { useAccounts } from "@/contexts/AccountsContext";
import { useCategories } from "@/contexts/CategoriesContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import type { RecurringTransaction } from "@/lib/types";

interface Props {
  onEdit: (transaction: RecurringTransaction) => void;
  onDelete: (id: string) => Promise<void>;
  onToggle: (id: string) => Promise<void>;
}

const formatCustomInterval = (ci: RecurringTransaction["customInterval"]) => {
  if (!ci) return "-";
  const parts: string[] = [];
  if (ci.everyXDays) parts.push(`Every ${ci.everyXDays} day(s)`);
  if (ci.everyXWeeks) parts.push(`Every ${ci.everyXWeeks} week(s)`);
  if (ci.dayOfMonth) parts.push(`Day ${ci.dayOfMonth}`);
  if (ci.dayOfWeek) parts.push(ci.dayOfWeek);
  if (ci.weekOfMonth) parts.push(ci.weekOfMonth);
  return parts.join(", ") || "-";
};

export const RecurringTransactionsTable: FC<Props> = ({ onEdit, onDelete, onToggle }) => {
  const { transactions } = useRecurringTransactions();
  const { accounts } = useAccounts();
  const { categories } = useCategories();

  const getAccountName = (id: string) => accounts.find(a => a._id === id)?.name ?? "-";
  const getCategoryName = (id: string) => categories.find(c => c._id === id)?.name ?? "-";

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Account</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Frequency</TableHead>
          <TableHead>Custom Interval</TableHead>
          <TableHead>Next Due</TableHead>
          <TableHead>Active</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {transactions.map(t => (
          <TableRow key={t._id}>
            <TableCell>{t.name}</TableCell>
            <TableCell>{t.amount} {accounts.find(a => a._id === t.accountId)?.currency ?? ""}</TableCell>
            {/* <TableCell>{accounts.find(a => a._id === t.accountId)?.name ?? "-"}</TableCell> */}
            <TableCell>{getAccountName(t.accountId)}</TableCell>
            <TableCell>{getCategoryName(t.categoryId)}</TableCell>
            <TableCell>{t.frequency}</TableCell>
            <TableCell>{t.frequency === "custom" ? formatCustomInterval(t.customInterval) : "-"}</TableCell>
            <TableCell>{new Date(t.nextDueDate).toLocaleDateString()}</TableCell>
            <TableCell>{t.isActive ? "Yes" : "No"}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <MoreHorizontal className="cursor-pointer" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => onEdit(t)}>Edit</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onToggle(t._id)}>Toggle</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(t._id)}>Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
