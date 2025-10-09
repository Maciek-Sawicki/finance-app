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



export const CreateAccountDialog = ({ open, onClose, onSave }: CreateAccountDialogProps) => {
  const [form, setForm] = useState<Partial<Account>>({
    name: "",
    description: "",
    type: "",
    icon: "",
    currency: "USD",
    balance: 0,
  });

  const isFormValid = form.name && form.type && form.icon && /^[0-9]*\.?[0-9]*$/.test(form.balanceStr ?? "");

  const handleChange = (field: keyof Account, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.type || !form.icon) {
      alert("Please fill in all required fields (Name, Type, Icon).");
      return;
    }

    const balanceNumber = parseFloat(form.balanceStr || "0");

    const dataToSave = {
      ...form,
      balance: isNaN(balanceNumber) ? 0 : balanceNumber,
    };

    await onSave(dataToSave);
    onClose();
    setForm({
      name: "",
      description: "",
      type: "",
      icon: "",
      currency: "USD",
      balance: 0,
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
            <Input
              value={form.name ?? ""}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>

          <div>
            <Label>Type</Label>
            <Select
              value={form.type ?? ""}
              onValueChange={(value) => handleChange("type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {accountTypes.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Icon</Label>
            <Select
              value={form.icon ?? ""}
              onValueChange={(value) => handleChange("icon", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select icon" />
              </SelectTrigger>
              <SelectContent>
                {accountIcons.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
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
            <Select
              value={form.currency ?? "USD"}
              onValueChange={(value) => handleChange("currency", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
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
                  setForm((prev) => ({
                    ...prev,
                    balanceStr: value
                  }));
                }
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
