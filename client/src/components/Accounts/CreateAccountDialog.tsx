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
import type { Account } from "@/lib/types";
import { accountTypes, accountIcons, currencies } from "@/lib/constants";

type CreateAccountDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Account>) => Promise<void>;
};

type AccountForm = Partial<Account> & { balanceStr?: string };

export const CreateAccountDialog = ({ open, onClose, onSave }: CreateAccountDialogProps) => {
  const [form, setForm] = useState<AccountForm>({
    name: "",
    description: "",
    type: "",
    icon: "",
    currency: "USD",
    balanceStr: "",
  });

  const isFormValid =
    !!form.name &&
    !!form.type &&
    !!form.icon &&
    /^[0-9]*\.?[0-9]*$/.test(form.balanceStr ?? "0");

  const handleChange = (field: keyof Account | "balanceStr", value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.type || !form.icon) {
      alert("Please fill in all required fields (Name, Type, Icon).");
      return;
    }

    const startingBalance = parseFloat(form.balanceStr || "0");

    const dataToSave: Partial<Account> = {
      name: form.name,
      type: form.type,
      icon: form.icon,
      description: form.description,
      currency: form.currency,
      startingBalance: isNaN(startingBalance) ? 0 : startingBalance,
      isDefault: form.isDefault ?? false,
    };

    await onSave(dataToSave);
    onClose();

    setForm({
      name: "",
      description: "",
      type: "",
      icon: "",
      currency: "USD",
      balanceStr: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Account</DialogTitle>
          <DialogDescription>
            Fill in the account details below and click Create.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Name</Label>
            <Input value={form.name ?? ""} onChange={(e) => handleChange("name", e.target.value)} />
          </div>

          <div>
            <Label>Type</Label>
            <Select value={form.type ?? ""} onValueChange={(v) => handleChange("type", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {accountTypes.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Icon</Label>
            <Select value={form.icon ?? ""} onValueChange={(v) => handleChange("icon", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select icon" />
              </SelectTrigger>
              <SelectContent>
                {accountIcons.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Description</Label>
            <Input
              value={form.description ?? ""}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>

          <div>
            <Label>Currency</Label>
            <Select value={form.currency ?? "USD"} onValueChange={(v) => handleChange("currency", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Starting Balance</Label>
            <Input
              type="text"
              value={form.balanceStr ?? ""}
              placeholder="0.00"
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
                  handleChange("balanceStr", value);
                }
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
