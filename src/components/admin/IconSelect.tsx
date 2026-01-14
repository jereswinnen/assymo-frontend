"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ICON_OPTIONS, ICON_OPTIONS_WITH_NONE, iconMap } from "@/lib/icons";
import { ChevronsUpDownIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [open, setOpen] = useState(false);
  const options = allowNone ? ICON_OPTIONS_WITH_NONE : ICON_OPTIONS;
  const SelectedIcon = value ? iconMap[value] : null;

  const handleSelect = (iconValue: string) => {
    onValueChange(iconValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2">
            {SelectedIcon ? (
              <>
                <SelectedIcon className="size-4" />
                <span className="text-muted-foreground">
                  {options.find((opt) => opt.value === value)?.label}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[276px] p-2" align="start">
        <div className="grid grid-cols-6 gap-1">
          {allowNone && (
            <button
              onClick={() => handleSelect("")}
              className={cn(
                "flex size-10 items-center justify-center rounded-md hover:bg-accent",
                value === "" && "bg-accent"
              )}
            >
              <XIcon className="size-5 text-muted-foreground" />
            </button>
          )}
          {ICON_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  "flex size-10 items-center justify-center rounded-md hover:bg-accent",
                  value === opt.value && "bg-accent"
                )}
              >
                <Icon className="size-5" />
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
