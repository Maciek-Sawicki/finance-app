"use client";

import { useState, useEffect } from "react";
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
import { accountTypes, accountIcons } from "@/lib/constants";

type EditAccountDialogProps = {
  account: Account | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, data: Partial<Account>) => Promise<void>;
};

export const EditAccountDialog = ({
  account,
  open,
  onClose,
  onSave,
}: EditAccountDialogProps) => {
  const [form, setForm] = useState<Partial<Account>>({});

  useEffect(() => {
    if (account) {
      setForm({
        name: account.name,
        description: account.description,
        type: account.type,
        icon: account.icon,
      });
    }
  }, [account]);

  const handleChange = (field: keyof Account, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!account) return;
    await onSave(account._id, form);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
