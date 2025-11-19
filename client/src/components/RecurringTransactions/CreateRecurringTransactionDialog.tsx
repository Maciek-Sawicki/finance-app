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

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export const CreateRecurringTransactionDialog: React.FC<Props> = ({ open, onClose, onSave }) => {
  const { accounts } = useAccounts();
  const { categories } = useCategories();

  const [form, setForm] = useState({
    name: "",
    accountId: "",
    categoryId: "",
    amount: "",
    currency: "PLN",
    frequency: "monthly",
    nextDueDate: new Date().toISOString().slice(0, 10),
    isActive: true,
    customInterval: {} as any,
  });

  const handleChange = (field: string, value: any) => {
    if (field === "frequency" && value === "custom" && !form.customInterval) {
      setForm(prev => ({ ...prev, frequency: value, customInterval: {} }));
    } else {
      setForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async () => {
    await onSave(form);
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
                {accounts.map(a => <SelectItem key={a._id} value={a._id}>{a.name}</SelectItem>)}
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
                {categories.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Amount</Label>
            <Input type="number" value={form.amount} onChange={e => handleChange("amount", e.target.value)} />
          </div>

          <div>
            <Label>Frequency</Label>
            <Select value={form.frequency} onValueChange={val => handleChange("frequency", val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {["daily","weekly","biweekly","monthly","quarterly","yearly","custom"].map(f => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
