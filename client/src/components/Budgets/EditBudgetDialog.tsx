"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import type { Budget, Category } from "@/lib/types";
import { currencies } from "@/lib/constants";
import { CategoriesService } from "@/services/categories";

type EditBudgetDialogProps = {
  budget: Budget | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, data: Partial<Budget>) => Promise<void>;
};

export const EditBudgetDialog = ({
  budget,
  open,
  onClose,
  onSave,
}: EditBudgetDialogProps) => {
  const [form, setForm] = useState<Partial<Budget>>({});
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (budget) {
      setForm({
        categoryId: budget.categoryId, 
        amount: budget.amount,
        currency: budget.currency,
        startDate: budget.startDate,
        endDate: budget.endDate,
        type: budget.type,
        carryOver: budget.carryOver,
        status: budget.status,
      });
    }
  }, [budget]);

  useEffect(() => {
    const fetchCategories = async () => {
      const cats = await CategoriesService.getAll();
      const expenseCats = cats.filter((c) => c.type === "expense");
      setCategories(expenseCats);
    };
    fetchCategories();
  }, []);


  const handleChange = (field: keyof Budget, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!budget) return;
    await onSave(budget._id, form);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Budget</DialogTitle>
          <DialogDescription>
            Fill in the budget details below and click Create.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Category</Label>
            <Select
              value={form.categoryId?._id ?? ""}
              onValueChange={(value) => {
                const selected = categories.find((c) => c._id === value);
                if (selected) handleChange("categoryId", selected);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat._id} value={cat._id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Amount</Label>
            <Input
              type="number"
              step="0.01"
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full text-left">
                    {form.startDate
                      ? new Date(form.startDate).toLocaleDateString()
                      : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.startDate ? new Date(form.startDate) : undefined}
                    onSelect={(date) =>
                      handleChange("startDate", date?.toISOString())
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full text-left">
                    {form.endDate
                      ? new Date(form.endDate).toLocaleDateString()
                      : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.endDate ? new Date(form.endDate) : undefined}
                    onSelect={(date) => handleChange("endDate", date?.toISOString())}
                  />
                </PopoverContent>
              </Popover>
            </div>
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
                <SelectItem value="fixed">Fixed</SelectItem>
                <SelectItem value="recurring">Recurring</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Status</Label>
            <Select
              value={form.status ?? ""}
              onValueChange={(value) => handleChange("status", value)}
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
              onCheckedChange={(checked) =>
                handleChange("carryOver", checked === true)
              }
            />
            <Label>Carry over remaining funds</Label>
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
