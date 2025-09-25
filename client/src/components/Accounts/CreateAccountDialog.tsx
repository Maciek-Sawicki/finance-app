"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
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

  const handleChange = (field: keyof Account, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    await onSave(form);
    onClose();
    setForm({
      name: "",
      description: "",
      type: "",
      icon: "",
      currency: "USD",
      balance: 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Account</DialogTitle>
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
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="investment">Investment</SelectItem>
                <SelectItem value="savings">Savings</SelectItem>
                <SelectItem value="loan">Loan</SelectItem>
                <SelectItem value="mortgage">Mortgage</SelectItem>
                <SelectItem value="retirement">Retirement</SelectItem>
                <SelectItem value="brokerage">Brokerage</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="joint">Joint</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
                <SelectItem value="prepaid">Prepaid</SelectItem>
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
                <SelectItem value="🏦">🏦</SelectItem>
                <SelectItem value="💵">💵</SelectItem>
                <SelectItem value="💳">💳</SelectItem>
                <SelectItem value="📈">📈</SelectItem>
                <SelectItem value="💰">💰</SelectItem>
                <SelectItem value="🪙">🪙</SelectItem>
                <SelectItem value="🏧">🏧</SelectItem>
                <SelectItem value="🏠">🏠</SelectItem>
                <SelectItem value="📉">📉</SelectItem>
                <SelectItem value="💹">💹</SelectItem>
                <SelectItem value="💎">💎</SelectItem>
                <SelectItem value="💷">💷</SelectItem>
                <SelectItem value="💶">💶</SelectItem>
                <SelectItem value="💴">💴</SelectItem>
                <SelectItem value="💸">💸</SelectItem>
                <SelectItem value="📊">📊</SelectItem>
                <SelectItem value="💼">💼</SelectItem>
                <SelectItem value="🧾">🧾</SelectItem>
                <SelectItem value="🔑">🔑</SelectItem>
                <SelectItem value="⚖️">⚖️</SelectItem>
                <SelectItem value="🏅">🏅</SelectItem>
                <SelectItem value="🥇">🥇</SelectItem>
                <SelectItem value="🥈">🥈</SelectItem>
                <SelectItem value="🥉">🥉</SelectItem>
                <SelectItem value="💡">💡</SelectItem>
                <SelectItem value="🛡️">🛡️</SelectItem>
                <SelectItem value="🏢">🏢</SelectItem>
                <SelectItem value="🌍">🌍</SelectItem>
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
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="PLN">PLN</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="JPY">JPY</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Starting Balance</Label>
            <Input
              type="number"
              value={form.balance ?? 0}
              onChange={(e) => handleChange("balance", parseFloat(e.target.value))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
