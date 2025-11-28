"use client";

import { CircleXIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryFilter } from "@/components/CategoryFilter";

interface FilterOption {
  _id: string;
  name: string;
  slug: { current: string };
}

interface CategoryWithOptions {
  _id: string;
  name: string;
  slug: { current: string };
  options: FilterOption[];
}

interface FilterBarProps {
  categories: CategoryWithOptions[];
  selectedFilters: Record<string, string[]>;
  onFiltersChange: (filters: Record<string, string[]>) => void;
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

  // Only show categories that have options
  const visibleCategories = categories.filter((cat) => cat.options.length > 0);

  if (visibleCategories.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <p className="mb-0! text-sm font-medium text-stone-600">Filter op:</p>
      <div className="flex flex-wrap items-center gap-3">
        {visibleCategories.map((category) => (
          <CategoryFilter
            key={category._id}
            category={category}
            options={category.options}
            selectedOptions={selectedFilters[category.slug.current] || []}
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
