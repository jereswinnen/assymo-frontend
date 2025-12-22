"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ICON_OPTIONS, ICON_OPTIONS_WITH_NONE } from "@/lib/icons";

interface IconSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  allowNone?: boolean;
}

export function IconSelect({
  value,
  onValueChange,
  placeholder = "Kies icoon",
  allowNone = false,
}: IconSelectProps) {
  const options = allowNone ? ICON_OPTIONS_WITH_NONE : ICON_OPTIONS;

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <SelectItem key={opt.value || "none"} value={opt.value || "none"}>
              <span className="flex items-center gap-2">
                {Icon && <Icon className="size-4" />}
                {opt.label}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
