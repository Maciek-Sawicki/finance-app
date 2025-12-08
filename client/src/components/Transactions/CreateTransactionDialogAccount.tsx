"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ChevronDownIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import * as Tabs from "@radix-ui/react-tabs";
import type { Account, Category } from "@/lib/types";
import { Separator } from "@/components/ui/separator";

type CreateTransactionDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  accounts: Account[];
  categories: Category[];
};

export const CreateTransactionDialogAccount = ({
  open,
  onClose,
  onSave,
  accounts,
  categories,
}: CreateTransactionDialogProps) => {
  const [tab, setTab] = useState<"income" | "expense">("income");
  const [openDate, setOpenDate] = useState(false);

  const account = accounts[0];

  const [form, setForm] = useState({
    categoryId: "",
    amount: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
    exclude: false,
    settled: false,
  });

  const handleChange = (field: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isValid = () => form.amount && form.categoryId;

  const localDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };


  const handleSubmit = async () => {
    if (!isValid() || !account) return;

    const payload = {
      accountId: account._id,
      categoryId: form.categoryId,
      amount: parseFloat(form.amount),
      description: form.description,
      date: form.date,
      type: tab,
      settled: form.settled,
      exclude: form.exclude,
    };

    await onSave(payload);
    onClose();

    setForm({
      categoryId: "",
      amount: "",
      description: "",
      date: new Date().toISOString().slice(0, 10),
      exclude: false,
      settled: false,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-xl max-w-lg bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))]">
        <DialogHeader>
          <DialogTitle>Create Transaction</DialogTitle>
          <DialogDescription>
            Choose transaction type and fill in details.
          </DialogDescription>
        </DialogHeader>

        <Tabs.Root value={tab} onValueChange={(val) => setTab(val as any)}>
          <Tabs.List className="grid grid-cols-2 gap-2 mb-4">
            {["income", "expense"].map((t) => (
              <Tabs.Trigger
                key={t}
                value={t}
                className={`p-2 rounded text-center font-medium transition-colors ${tab === t
                  ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                  : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                  }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {["income", "expense"].map((type) => (
            <Tabs.Content key={type} value={type} className="space-y-4">
              <div>
                <Label>Account</Label>
                <Input
                  value={account ? account.name : "Loading..."}
                  disabled
                  className="bg-[hsl(var(--input))] text-[hsl(var(--input-foreground))]"
                />
              </div>

              <div>
                <Label>Category</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(val) => handleChange("categoryId", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((cat) => cat.type === type && cat.favorite)
                      .map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          {cat.icon && <span className="mr-2">{cat.icon}</span>}
                          {cat.name}
                        </SelectItem>
                      ))}

                    <Separator className="my-1" />

                    {categories
                      .filter((cat) => cat.type === type && !cat.favorite)
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
                      className="w-full justify-between font-normal rounded"
                    >
                      {form.date
                        ? new Date(form.date).toLocaleDateString()
                        : "Select date"}
                      <ChevronDownIcon />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto overflow-hidden p-0"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={form.date ? new Date(form.date) : undefined}
                      captionLayout="dropdown"
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
                  onChange={(e) =>
                    handleChange("description", e.target.value)
                  }
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
                  Excluded transactions won't be included in reports but will
                  change the account balance.
                </p>
              </div>
            </Tabs.Content>
          ))}
        </Tabs.Root>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-[hsl(var(--border))] text-[hsl(var(--foreground))]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid()}
            className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
