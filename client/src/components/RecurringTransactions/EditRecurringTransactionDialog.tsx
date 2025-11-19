"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from "@/components/ui/select";
import { useAccounts } from "@/contexts/AccountsContext";
import { useCategories } from "@/contexts/CategoriesContext";
import type { RecurringTransaction } from "@/lib/types";
import { CustomIntervalEditor } from "./CustomIntervalEditor";

interface Props {
  open: boolean;
  onClose: () => void;
  transaction: RecurringTransaction | null;
  onSave: (id: string, data: any) => Promise<void>;
}

export const EditRecurringTransactionDialog: React.FC<Props> = ({ open, onClose, transaction, onSave }) => {
  const { accounts } = useAccounts();
  const { categories } = useCategories();

  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (transaction) setForm({ ...transaction });
  }, [transaction]);

  const handleChange = (field: string, value: any) => setForm((prev: any) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (transaction) await onSave(transaction._id, form);
    onClose();
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Recurring Transaction</DialogTitle>
          <DialogDescription>Update details below</DialogDescription>
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
                {["daily", "weekly", "biweekly", "monthly", "quarterly", "yearly", "custom"].map(f => (
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
          <Button onClick={handleSubmit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
