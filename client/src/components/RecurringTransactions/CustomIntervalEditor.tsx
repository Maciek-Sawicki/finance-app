"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from "@/components/ui/select";
import type { CustomInterval } from "@/lib/types";

interface Props {
  value: CustomInterval;
  onChange: (val: CustomInterval) => void;
}

export const CustomIntervalEditor: React.FC<Props> = ({ value = {}, onChange }) => {
  const handleChange = (field: keyof CustomInterval, val: any) => {
    onChange({ ...value, [field]: val });
  };

  return (
    <div className="space-y-2">
      <Label>Custom Interval</Label>

      <Input
        type="number"
        placeholder="Every X days"
        value={value.everyXDays ?? ""}
        onChange={e => handleChange("everyXDays", e.target.value ? Number(e.target.value) : undefined)}
      />

      <Input
        type="number"
        placeholder="Every X weeks"
        value={value.everyXWeeks ?? ""}
        onChange={e => handleChange("everyXWeeks", e.target.value ? Number(e.target.value) : undefined)}
      />

      <Input
        type="number"
        placeholder="Day of Month"
        value={value.dayOfMonth ?? ""}
        onChange={e => handleChange("dayOfMonth", e.target.value ? Number(e.target.value) : undefined)}
      />

      <Select
        value={value.dayOfWeek ?? "none"}
        onValueChange={val => handleChange("dayOfWeek", val === "none" ? undefined : val)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Day of Week" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(d => (
            <SelectItem key={d} value={d}>{d}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.weekOfMonth ?? "none"}
        onValueChange={val => handleChange("weekOfMonth", val === "none" ? undefined : val)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Week of Month" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          {["First", "Second", "Third", "Fourth", "Last"].map(w => (
            <SelectItem key={w} value={w}>{w}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
