"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";
import { CheckIcon, ImageIcon } from "lucide-react";

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
    <RadioGroupPrimitive.Root
      value={value || ""}
      onValueChange={onChange}
      disabled={disabled}
      className={cn("grid gap-3 sm:grid-cols-2", className)}
    >
      {options.map((option) => (
        <RadioGroupPrimitive.Item
          key={option.value}
          value={option.value}
          className={cn(
            "group relative flex flex-col rounded-lg border bg-white p-4 text-left transition-all",
            "hover:border-stone-300 hover:bg-stone-50",
            "data-[state=checked]:border-accent-dark data-[state=checked]:ring-1 data-[state=checked]:ring-accent-dark",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          {/* Image placeholder */}
          <div className="mb-3 flex h-24 items-center justify-center rounded-md bg-stone-100">
            {option.image ? (
              <img
                src={option.image}
                alt={option.label}
                className="h-full w-full rounded-md object-cover"
              />
            ) : (
              <ImageIcon className="size-8 text-stone-300" />
            )}
          </div>

          {/* Content */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <span className="text-sm font-medium text-stone-900">
                {option.label}
              </span>
              {option.description && (
                <p className="mt-1 text-xs text-stone-500">
                  {option.description}
                </p>
              )}
            </div>

            {/* Check indicator */}
            <div
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                "group-data-[state=checked]:border-accent-dark group-data-[state=checked]:bg-accent-dark group-data-[state=checked]:text-accent-light",
                "group-data-[state=unchecked]:border-stone-300"
              )}
            >
              <CheckIcon className="size-3 opacity-0 group-data-[state=checked]:opacity-100" />
            </div>
          </div>
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  );
}
