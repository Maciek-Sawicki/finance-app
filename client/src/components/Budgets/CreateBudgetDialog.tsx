"use client";

import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ChevronDownIcon } from "lucide-react";
import type { Category, Budget } from "@/lib/types";
import { currencies } from "@/lib/constants";

type CreateBudgetDialogProps = {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  onSave: (data: Partial<Budget>) => Promise<void>;
};

export const CreateBudgetDialog = ({
  open,
  onClose,
  categories,
  onSave,
}: CreateBudgetDialogProps) => {
  const [form, setForm] = useState<Partial<Budget>>({
    categoryId: undefined,
    amount: 0,
    currency: "USD",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    type: "fixed",
    carryOver: false,
    status: "active",
  });

  const [openStart, setOpenStart] = useState(false);
  const [openEnd, setOpenEnd] = useState(false);

  const handleChange = (field: keyof Budget, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.categoryId || !form.amount || !form.currency || !form.startDate || !form.endDate) {
      alert("Please fill in all required fields.");
      return;
    }

    await onSave(form);
    onClose();
    setForm({
      categoryId: undefined,
      amount: 0,
      currency: "USD",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      type: "fixed",
      carryOver: false,
      status: "active",
    });
  };

  const filteredCategories = categories.filter((c) => c.type === "expense");

  const localDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Budget</DialogTitle>
          <DialogDescription>
            Fill in the budget details below and click Create.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Category</Label>
            <Select
              value={form.categoryId?._id ?? ""}
              onValueChange={(val) => {
                const selected = filteredCategories.find((c) => c._id === val);
                handleChange("categoryId", selected ?? undefined);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((c) => (
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
              value={form.amount ?? ""}
              onChange={(e) => handleChange("amount", parseFloat(e.target.value))}
            />
          </div>

          <div>
            <Label>Currency</Label>
            <Select
              value={form.currency ?? "USD"}
              onValueChange={(val) => handleChange("currency", val)}
            >
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

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Start Date</Label>
              <Popover open={openStart} onOpenChange={setOpenStart}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {form.startDate ? new Date(form.startDate).toLocaleDateString() : "Select date"}
                    <ChevronDownIcon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.startDate ? new Date(form.startDate) : undefined}
                    onSelect={(date) => {
                      if (date) handleChange("startDate", localDateString(date));
                      setOpenStart(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>End Date</Label>
              <Popover open={openEnd} onOpenChange={setOpenEnd}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {form.endDate ? new Date(form.endDate).toLocaleDateString() : "Select date"}
                    <ChevronDownIcon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.endDate ? new Date(form.endDate) : undefined}
                    onSelect={(date) => {
                      if (date) handleChange("endDate", localDateString(date));
                      setOpenEnd(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label>Type</Label>
            <Select
              value={form.type ?? ""}
              onValueChange={(val) => handleChange("type", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixed</SelectItem>
                <SelectItem value="recurring">Recurring</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Status</Label>
            <Select
              value={form.status ?? ""}
              onValueChange={(val) => handleChange("status", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              checked={!!form.carryOver}
              onCheckedChange={(checked) => handleChange("carryOver", checked === true)}
            />
            <Label>Carry over remaining funds</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!form.categoryId || !form.amount || !form.currency || !form.startDate || !form.endDate}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
