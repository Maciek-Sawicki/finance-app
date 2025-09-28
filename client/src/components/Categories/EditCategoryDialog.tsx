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
import { Switch } from "@/components/ui/switch"
import type { Category } from "@/lib/types";
import { categoryIcons, categoryColors } from "@/lib/constants";

const categoryTypes = [
  { code: "income" },
  { code: "expense" },
];

type EditCategoryDialogProps = {
  category: Category | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, data: Partial<Category>) => Promise<void>;
};

export const EditCategoryDialog = ({
  category,
  open,
  onClose,
  onSave,
}: EditCategoryDialogProps) => {
  const [form, setForm] = useState<Partial<Category>>({});

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name,
        type: category.type,
        icon: category.icon,
        color: category.color,
        favorite: category.favorite,
      });
    }
  }, [category]);

  const handleChange = (field: keyof Category, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!category) return;
    await onSave(category._id, form);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
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
                {categoryTypes.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code}
                  </SelectItem>
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
                {categoryIcons.map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
              ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {categoryColors.map((color) => {
                const isSelected = form.color === color;
                return (
                  <button
                    key={color}
                    type="button"
                    className={`w-6 h-6 rounded-full border-2 ${
                      isSelected
                        ? "border-black dark:border-white"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleChange("color", color)}
                  />
                );
              })}
            </div>
          </div>


          <div className="flex items-center space-x-2">
            <Switch
              id="favorite"
              checked={form.favorite ?? false}
              onCheckedChange={(checked: boolean) => handleChange("favorite", checked)}
            />
            <Label htmlFor="favorite">Favorite</Label>
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
