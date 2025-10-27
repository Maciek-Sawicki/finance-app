"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ChevronDownIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import * as Tabs from "@radix-ui/react-tabs";
import { Separator } from "@/components/ui/separator";
import type { Account, Category, Transaction } from "@/lib/types";

type EditTransactionDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (id: string, data: any) => Promise<void>;
  transaction: Transaction | null;
  accounts: Account[];
  categories: Category[];
};

export const EditTransactionDialog = ({
  open,
  onClose,
  onSave,
  transaction,
  categories,
}: EditTransactionDialogProps) => {
  const [tab, setTab] = useState<"income" | "expense">("income");
  const [openDate, setOpenDate] = useState(false);

  const [form, setForm] = useState<any>({
    accountId: "",
    categoryId: null,
    amount: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
    exclude: false,
    settled: false,
  });

  useEffect(() => {
    if (transaction) {
      setTab(transaction.type as "income" | "expense");
      setForm({
        accountId: transaction.accountId?._id ?? "",
        categoryId: transaction.categoryId ?? null,
        amount: transaction.amount,
        description: transaction.description ?? "",
        date: transaction.date.slice(0, 10),
        exclude: transaction.exclude ?? false,
        settled: transaction.settled ?? false,
      });
    }
  }, [transaction]);

  const handleChange = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleTabChange = (newTab: "income" | "expense") => {
    if (newTab !== tab) {
      setTab(newTab);
      setForm((prev: any) => ({ ...prev, categoryId: null }));
    }
  };

  const isValid = () => form.accountId && form.amount && form.categoryId;

  const handleSubmit = async () => {
    if (!transaction || !isValid()) return;
    const payload = {
      accountId: form.accountId,
      categoryId: form.categoryId._id,
      amount: parseFloat(form.amount),
      description: form.description,
      date: form.date,
      type: tab,
      settled: form.settled,
      exclude: form.exclude,
    };
    await onSave(transaction._id, payload);
    onClose();
  };

  const localDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const filteredCategories = categories.filter((c) => c.type === tab);
  const favorites = filteredCategories.filter((c) => c.favorite);
  const others = filteredCategories.filter((c) => !c.favorite);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-xl max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>
            Update transaction details below.
          </DialogDescription>
        </DialogHeader>

        <Tabs.Root value={tab} onValueChange={(val) => handleTabChange(val as any)}>
          <Tabs.List className="grid grid-cols-2 gap-2 mb-4">
            {["income", "expense"].map((t) => (
              <Tabs.Trigger
                key={t}
                value={t}
                className={`p-2 rounded text-center font-medium transition-colors ${
                  tab === t
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                    : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <div className="space-y-4">
            <div>
              <Label>Category</Label>
              <Select
                value={form.categoryId?._id ?? ""}
                onValueChange={(val) => {
                  const selected = categories.find((c) => c._id === val);
                  handleChange("categoryId", selected ?? null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {favorites.length > 0 && (
                    <>
                      {favorites.map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          {cat.icon && <span className="mr-2">{cat.icon}</span>}
                          {cat.name}
                        </SelectItem>
                      ))}
                      <Separator className="my-1" />
                    </>
                  )}

                  {others.map((cat) => (
                    <SelectItem key={cat._id} value={cat._id}>
                      {cat.icon && <span className="mr-2">{cat.icon}</span>}
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
              />
            </div>

            <div>
              <Label>Date</Label>
              <Popover open={openDate} onOpenChange={setOpenDate}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between font-normal"
                  >
                    {form.date ? new Date(form.date).toLocaleDateString() : "Select date"}
                    <ChevronDownIcon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.date ? new Date(form.date) : undefined}
                    onSelect={(date) => {
                      if (date) handleChange("date", localDateString(date));
                      setOpenDate(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>

            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <Label>Exclude</Label>
                <Switch
                  checked={form.exclude}
                  onCheckedChange={(val) => handleChange("exclude", val)}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Excluded transactions won't be included in reports but will affect balances.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Label>Settled</Label>
              <Switch
                checked={form.settled}
                onCheckedChange={(val) => handleChange("settled", val)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Mark as settled if this transaction has been finalized.
            </p>
          </div>
        </Tabs.Root>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid()}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
