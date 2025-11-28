"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface FilterOption {
  _id: string;
  name: string;
  slug: { current: string };
}

interface CategoryFilterProps {
  category: {
    _id: string;
    name: string;
    slug: { current: string };
  };
  options: FilterOption[];
  selectedOptions: string[];
  onSelectionChange: (categorySlug: string, optionSlugs: string[]) => void;
}

export function CategoryFilter({
  category,
  options,
  selectedOptions,
  onSelectionChange,
}: CategoryFilterProps) {
  const [open, setOpen] = useState(false);

  const handleToggle = (optionSlug: string) => {
    const newSelection = selectedOptions.includes(optionSlug)
      ? selectedOptions.filter((s) => s !== optionSlug)
      : [...selectedOptions, optionSlug];
    onSelectionChange(category.slug.current, newSelection);
  };

  const handleClear = () => {
    onSelectionChange(category.slug.current, []);
  };

  const selectedCount = selectedOptions.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="rounded-full gap-1.5 pr-2.5 bg-violet-400"
          aria-expanded={open}
        >
          {category.name}
          {selectedCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 min-w-5 text-center">
              {selectedCount}
            </span>
          )}
          <ChevronDown className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-0">
        <div className="p-3 border-b">
          <p className="font-medium text-sm">{category.name}</p>
        </div>
        <div className="p-2 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <div
              key={option._id}
              className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
              onClick={() => handleToggle(option.slug.current)}
            >
              <Checkbox
                id={option._id}
                checked={selectedOptions.includes(option.slug.current)}
                onCheckedChange={() => handleToggle(option.slug.current)}
              />
              <Label
                htmlFor={option._id}
                className="cursor-pointer flex-1 font-normal"
              >
                {option.name}
              </Label>
            </div>
          ))}
        </div>
        {selectedCount > 0 && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={handleClear}
            >
              Wis selectie
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
