"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface RadioCardOption {
  value: string;
  label: string;
  description?: string;
  image?: string; // URL to image (for future use)
}

interface RadioCardGroupProps {
  options: RadioCardOption[];
  value: string | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function RadioCardGroup({
  options,
  value,
  onChange,
  disabled = false,
  className,
}: RadioCardGroupProps) {
  return (
    <RadioGroup
      value={value || ""}
      onValueChange={onChange}
      disabled={disabled}
      className={cn("grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4", className)}
    >
      {options.map((option) => (
        <Label
          key={option.value}
          htmlFor={option.value}
          className={cn(
            "relative flex! flex-col! items-stretch! gap-0! rounded-lg border bg-white overflow-hidden cursor-pointer transition-all",
            "hover:border-stone-300 hover:bg-stone-50",
            "has-data-[state=checked]:border-accent-dark has-data-[state=checked]:ring-1 has-data-[state=checked]:ring-accent-dark",
            "[&:has(:focus-visible)]:ring-2 [&:has(:focus-visible)]:ring-accent-dark [&:has(:focus-visible)]:ring-offset-2",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          {/* Image placeholder */}
          <div className="w-full flex h-24 items-center justify-center bg-stone-100">
            {option.image ? (
              <img
                src={option.image}
                alt={option.label}
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageIcon className="size-8 text-stone-300" />
            )}
          </div>

          {/* Content */}
          <div className="flex items-center justify-between gap-2 p-3 sm:p-4">
            <div className="flex-1">
              <span className="text-sm font-medium text-stone-900">
                {option.label}
              </span>
              {option.description && (
                <p className="mt-1 text-xs text-stone-500 font-normal">
                  {option.description}
                </p>
              )}
            </div>

            {/* Radio indicator */}
            <RadioGroupItem
              value={option.value}
              id={option.value}
              className="shrink-0"
            />
          </div>
        </Label>
      ))}
    </RadioGroup>
  );
}
