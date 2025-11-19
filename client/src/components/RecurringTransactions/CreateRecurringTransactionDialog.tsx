"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from "@/components/ui/select";
import { useAccounts } from "@/contexts/AccountsContext";
import { useCategories } from "@/contexts/CategoriesContext";
import { CustomIntervalEditor } from "./CustomIntervalEditor";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
const formatLocalDate = (dateStr?: string) => {
  if (!dateStr) return "Select date";
  const [year, month, day] = dateStr.split("-").map(Number);
  return format(new Date(year, month - 1, day), "yyyy-MM-dd");
};



interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export const CreateRecurringTransactionDialog: React.FC<Props> = ({ open, onClose, onSave }) => {
  const { accounts } = useAccounts();
  const { categories } = useCategories();

  const [form, setForm] = useState<any>({
    name: "",
    accountId: "",
    categoryId: "",
    amount: "",
    frequency: "monthly",
    nextDueDate: new Date().toISOString().slice(0, 10),
    customInterval: {},
    isActive: true,
  });

  const handleChange = (field: string, val: any) =>
    setForm((prev: any) => ({ ...prev, [field]: val }));

  const handleSubmit = async () => {
    const payload: any = {
      name: form.name,
      accountId: form.accountId,
      categoryId: form.categoryId,
      amount: Number(form.amount),
      frequency: form.frequency,
      nextDueDate: new Date(form.nextDueDate).toISOString(),
      isActive: form.isActive,
      repeatCount: 0, // domyślnie
    };

    if (form.frequency === "custom") {
      payload.customInterval = form.customInterval;
    }

    await onSave(payload);
    onClose();
  };


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Recurring Transaction</DialogTitle>
          <DialogDescription>Fill in the details</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={e => handleChange("name", e.target.value)} />
          </div>

          <div>
            <Label>Account</Label>
            <Select value={form.accountId} onValueChange={val => handleChange("accountId", val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(a => (
                  <SelectItem key={a._id} value={a._id}>
                    {a.name} ({a.currency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Category</Label>
            <Select value={form.categoryId} onValueChange={val => handleChange("categoryId", val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Amount ({accounts.find(a => a._id === form.accountId)?.currency ?? ""})</Label>
            <Input
              type="number"
              value={form.amount}
              onChange={e => handleChange("amount", Number(e.target.value))}
            />
          </div>

          <div>
            <Label>Frequency</Label>
            <Select value={form.frequency} onValueChange={val => handleChange("frequency", val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {["daily", "weekly", "biweekly", "monthly", "quarterly", "yearly", "custom"].map(f => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
              <Button variant="outline" className="w-full text-left">
  {formatLocalDate(form.nextDueDate)}
</Button>

              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={form.nextDueDate ? new Date(form.nextDueDate) : undefined}
                  onSelect={date => handleChange("nextDueDate", date?.toISOString().slice(0, 10))}
                />
              </PopoverContent>
            </Popover>
          </div>

          {form.frequency === "custom" && (
            <CustomIntervalEditor
              value={form.customInterval ?? {}}
              onChange={val => handleChange("customInterval", val)}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
