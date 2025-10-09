"use client";

import { useState, useEffect } from "react";
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
  PopoverTrigger
} from "@/components/ui/popover";
import {
  Calendar
} from "@/components/ui/calendar";
import { ChevronDownIcon } from "lucide-react"
import { Switch } from "@/components/ui/switch";
import * as Tabs from "@radix-ui/react-tabs";
import type { Account, Category } from "@/lib/types";
import { RatesService } from "@/services/rates";

type CreateTransactionDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  accounts: Account[];
  categories: Category[];
};

export const CreateTransactionDialog = ({
  open,
  onClose,
  onSave,
  accounts,
  categories,
}: CreateTransactionDialogProps) => {
  const [tab, setTab] = useState<"income" | "expense" | "transfer">("income");

  const [openDate, setOpenDate] = useState(false);

  const [form, setForm] = useState<any>({
    accountId: "",
    categoryId: "",
    fromAccountId: "",
    toAccountId: "",
    amount: "",
    toAmount: "",
    customToAmount: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
    exclude: false,
    settled: false,
  });

  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  const handleChange = (field: string, value: string | number | boolean) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    const calculateToAmount = async () => {
      if (
        tab !== "transfer" ||
        !form.amount ||
        !form.fromAccountId ||
        !form.toAccountId
      ) {
        handleChange("toAmount", "");
        setExchangeRate(null);
        return;
      }

      const fromAcc = accounts.find((a) => a._id === form.fromAccountId);
      const toAcc = accounts.find((a) => a._id === form.toAccountId);
      if (!fromAcc || !toAcc) return;

      try {
        const rate = await RatesService.getExchangeRate(fromAcc.currency, toAcc.currency);
        const toAmount = parseFloat(form.amount) * rate;
        handleChange("toAmount", toAmount.toFixed(2));
        setExchangeRate(rate);
      } catch (err) {
        console.error("Error calculating exchange:", err);
        handleChange("toAmount", form.amount);
        setExchangeRate(1);
      }
    };

    calculateToAmount();
  }, [form.amount, form.fromAccountId, form.toAccountId, tab, accounts]);

  const isValid = () => {
    if (tab === "transfer")
      return form.fromAccountId && form.toAccountId && form.amount;
    return form.accountId && form.amount && form.categoryId;
  };

  const handleSubmit = async () => {
    if (!isValid()) return;

    let payload: any = {};
    if (tab === "transfer") {
      payload = {
        fromAccountId: form.fromAccountId,
        toAccountId: form.toAccountId,
        amount: parseFloat(form.amount),
        toAmount: form.customToAmount ? parseFloat(form.customToAmount) : parseFloat(form.toAmount),
        description: form.description,
        date: form.date,
        type: "transfer",
        settled: form.settled,
        exclude: form.exclude,
      };
    } else {
      payload = {
        accountId: form.accountId,
        categoryId: form.categoryId,
        amount: parseFloat(form.amount),
        description: form.description,
        date: form.date,
        type: tab,
        settled: form.settled,
        exclude: form.exclude,
      };
    }

    await onSave(payload);
    onClose();

    setForm({
      accountId: "",
      categoryId: "",
      fromAccountId: "",
      toAccountId: "",
      amount: "",
      toAmount: "",
      customToAmount: "",
      description: "",
      date: new Date().toISOString().slice(0, 10),
      exclude: false,
      settled: false,
    });
    setExchangeRate(null);
  };

  const renderAccountSelect = (field: string, value: string) => (
    <Select value={value} onValueChange={(val) => handleChange(field, val)}>
      <SelectTrigger>
        <SelectValue placeholder="Select account" />
      </SelectTrigger>
      <SelectContent>
        {accounts.map((acc) => (
          <SelectItem key={acc._id} value={acc._id}>
            {acc.name} ({acc.currency})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-xl max-w-lg bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))]">
        <DialogHeader>
          <DialogTitle>Create Transaction</DialogTitle>
          <DialogDescription>Choose transaction type and fill in details.</DialogDescription>
        </DialogHeader>

        <Tabs.Root value={tab} onValueChange={(val) => setTab(val as any)}>
          <Tabs.List className="grid grid-cols-3 gap-2 mb-4">
            {["income", "expense", "transfer"].map((t) => (
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

          {["income", "expense", "transfer"].map((type) => (
            <Tabs.Content key={type} value={type} className="space-y-4">
              {(type === "income" || type === "expense") && (
                <>
                  <div>
                    <Label>Account</Label>
                    {renderAccountSelect("accountId", form.accountId)}
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
                      <SelectContent className="bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))]">
                        {categories
                          .filter((c) => c.type === type)
                          .map((c) => (
                            <SelectItem key={c._id} value={c._id}>
                              {c.name}
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
                          {form.date ? new Date(form.date).toLocaleDateString() : "Select date"}
                          <ChevronDownIcon />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={form.date ? new Date(form.date) : undefined}
                          captionLayout="dropdown"
                          onSelect={(date) => {
                            if (date) handleChange("date", date.toISOString().split("T")[0]);
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
                      Excluded transactions won't be included in reports but will change the account balance.
                    </p>
                  </div>

                </>
              )}

              {type === "transfer" && (
                <>
                  <div>
                    <Label>From Account</Label>
                    {renderAccountSelect("fromAccountId", form.fromAccountId)}
                  </div>
                  <div>
                    <Label>To Account</Label>
                    {renderAccountSelect("toAccountId", form.toAccountId)}
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={form.amount}
                      onChange={(e) => handleChange("amount", e.target.value)}
                    />
                  </div>
                  {exchangeRate && (
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">
                      Exchange rate: {exchangeRate.toFixed(4)}
                    </div>
                  )}
                  <div>
                    <Label>Calculated To Amount</Label>
                    <Input
                      type="number"
                      value={form.toAmount}
                      readOnly
                    />
                  </div>
                  <div>
                    <Label>Custom To Amount (optional)</Label>
                    <Input
                      type="number"
                      value={form.customToAmount}
                      onChange={(e) => handleChange("customToAmount", e.target.value)}
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
                          {form.date ? new Date(form.date).toLocaleDateString() : "Select date"}
                          <ChevronDownIcon />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={form.date ? new Date(form.date) : undefined}
                          captionLayout="dropdown"
                          onSelect={(date) => {
                            if (date) handleChange("date", date.toISOString().split("T")[0]);
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
                </>
              )}
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
}

