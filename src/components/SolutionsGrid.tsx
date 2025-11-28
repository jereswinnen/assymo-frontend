"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";
import SolutionCard from "@/components/SolutionCard";
import { FilterBar } from "@/components/FilterBar";

interface SolutionFilter {
  _id: string;
  name: string;
  slug: { current: string };
  category: {
    _id: string;
    name: string;
    slug: { current: string };
  };
}

interface Solution {
  _id: string;
  name: string;
  slug: { current: string };
  headerImage?: any;
  filters?: SolutionFilter[];
}

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

interface SolutionsGridProps {
  solutions: Solution[];
  categories: CategoryWithOptions[];
}

export function SolutionsGrid({ solutions, categories }: SolutionsGridProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Parse selected filters from URL
  const selectedFilters = useMemo(() => {
    const filters: Record<string, string[]> = {};
    categories.forEach((category) => {
      const param = searchParams.get(category.slug.current);
      if (param) {
        filters[category.slug.current] = param.split(",").filter(Boolean);
      }
    });
    return filters;
  }, [searchParams, categories]);

  // Update URL when filters change
  const handleFiltersChange = useCallback(
    (newFilters: Record<string, string[]>) => {
      const params = new URLSearchParams();

      Object.entries(newFilters).forEach(([categorySlug, optionSlugs]) => {
        if (optionSlugs.length > 0) {
          params.set(categorySlug, optionSlugs.join(","));
        }
      });

      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname]
  );

  // Filter solutions based on selected filters
  // Logic: OR within categories, AND between categories
  const filteredSolutions = useMemo(() => {
    const activeCategories = Object.entries(selectedFilters).filter(
      ([, options]) => options.length > 0
    );

    if (activeCategories.length === 0) {
      return solutions;
    }

    return solutions.filter((solution) => {
      // Must match ALL active categories (AND between categories)
      return activeCategories.every(([categorySlug, selectedOptions]) => {
        // Must match ANY selected option in this category (OR within category)
        return solution.filters?.some(
          (filter) =>
            filter.category.slug.current === categorySlug &&
            selectedOptions.includes(filter.slug.current)
        );
      });
    });
  }, [solutions, selectedFilters]);

  const hasActiveFilters = Object.values(selectedFilters).some(
    (options) => options.length > 0
  );

  return (
    <>
      <div className="col-span-full mb-6">
        <FilterBar
          categories={categories}
          selectedFilters={selectedFilters}
          onFiltersChange={handleFiltersChange}
        />
      </div>

      <section className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-10">
        {filteredSolutions.length > 0 ? (
          filteredSolutions.map((solution) => (
            <SolutionCard key={solution._id} solution={solution} />
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            {hasActiveFilters
              ? "Geen realisaties gevonden voor de geselecteerde filters."
              : "Geen realisaties beschikbaar."}
          </div>
        )}
      </section>
    </>
  );
}
