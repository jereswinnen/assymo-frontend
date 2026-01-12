"use client";

import { useState } from "react";
import { ChevronDown, CircleXIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface FilterOption {
  id: string;
  name: string;
  slug: string;
}

interface CategoryWithOptions {
  id: string;
  name: string;
  slug: string;
  filters: FilterOption[];
}

interface FilterBarProps {
  categories: CategoryWithOptions[];
  selectedFilters: Record<string, string[]>;
  onFiltersChange: (filters: Record<string, string[]>) => void;
}

interface CategoryFilterProps {
  category: {
    id: string;
    name: string;
    slug: string;
  };
  options: FilterOption[];
  selectedOptions: string[];
  onSelectionChange: (categorySlug: string, optionSlugs: string[]) => void;
}

function CategoryFilter({
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
    onSelectionChange(category.slug, newSelection);
    setOpen(false);
  };

  const handleClear = () => {
    onSelectionChange(category.slug, []);
  };

  const selectedCount = selectedOptions.length;

  const selectedNames = options
    .filter((opt) => selectedOptions.includes(opt.slug))
    .map((opt) => opt.name);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="cursor-pointer rounded-full gap-1.5 text-stone-700"
          aria-expanded={open}
        >
          {category.name}
          {selectedCount > 0 && ":"}
          {selectedCount > 0 && (
            <span className="opacity-70">{selectedNames.join(", ")}</span>
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
              key={option.id}
              className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
              onClick={() => handleToggle(option.slug)}
            >
              <Checkbox
                id={option.id}
                checked={selectedOptions.includes(option.slug)}
                onCheckedChange={() => handleToggle(option.slug)}
              />
              <Label
                htmlFor={option.id}
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

export function FilterBar({
  categories,
  selectedFilters,
  onFiltersChange,
}: FilterBarProps) {
  const handleCategoryChange = (
    categorySlug: string,
    optionSlugs: string[],
  ) => {
    onFiltersChange({
      ...selectedFilters,
      [categorySlug]: optionSlugs,
    });
  };

  const handleClearAll = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(selectedFilters).some(
    (options) => options.length > 0,
  );

  // Only show categories that have filters
  const visibleCategories = categories.filter((cat) => cat.filters.length > 0);

  if (visibleCategories.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <p className="mb-0! text-sm font-medium text-stone-600">Filter op:</p>
      <div className="flex flex-wrap items-center gap-3">
        {visibleCategories.map((category) => (
          <CategoryFilter
            key={category.id}
            category={category}
            options={category.filters}
            selectedOptions={selectedFilters[category.slug] || []}
            onSelectionChange={handleCategoryChange}
          />
        ))}
      </div>
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer ml-auto text-stone-500 rounded-full"
          onClick={handleClearAll}
        >
          <CircleXIcon className="size-4" />
          Wis filters
        </Button>
      )}
    </div>
  );
}
