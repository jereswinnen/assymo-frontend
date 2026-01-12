"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";
import Image from "next/image";
import { FilterBar } from "@/components/forms/FilterBar";
import { Action } from "./Action";
import { InfoIcon } from "lucide-react";

interface SolutionFilter {
  id: string;
  name: string;
  slug: string;
  category_id: string;
}

interface Solution {
  id: string;
  name: string;
  subtitle?: string;
  slug: string;
  header_image?: {
    url: string;
    alt?: string;
  };
  filters?: SolutionFilter[];
}

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

interface ProjectsGridProps {
  solutions: Solution[];
  categories: CategoryWithOptions[];
}

export function ProjectsGrid({ solutions, categories }: ProjectsGridProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Parse selected filters from URL
  const selectedFilters = useMemo(() => {
    const filters: Record<string, string[]> = {};
    categories.forEach((category) => {
      const param = searchParams.get(category.slug);
      if (param) {
        filters[category.slug] = param.split(",").filter(Boolean);
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
    [router, pathname],
  );

  // Build a map of category_id to category_slug for filtering
  const categoryIdToSlug = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((cat) => {
      map[cat.id] = cat.slug;
    });
    return map;
  }, [categories]);

  // Filter solutions based on selected filters
  // Logic: OR within categories, AND between categories
  const filteredSolutions = useMemo(() => {
    const activeCategories = Object.entries(selectedFilters).filter(
      ([, options]) => options.length > 0,
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
            categoryIdToSlug[filter.category_id] === categorySlug &&
            selectedOptions.includes(filter.slug),
        );
      });
    });
  }, [solutions, selectedFilters, categoryIdToSlug]);

  const hasActiveFilters = Object.values(selectedFilters).some(
    (options) => options.length > 0,
  );

  // Create a key that changes when filters change to trigger re-animation
  const filterKey = useMemo(() => {
    return Object.entries(selectedFilters)
      .map(([k, v]) => `${k}:${v.sort().join(",")}`)
      .sort()
      .join("|");
  }, [selectedFilters]);

  // Helper function to remove the "XX_" prefix pattern
  const cleanTitle = (title: string) => {
    return title.replace(/^\d+_/, "");
  };

  return (
    <>
      <div className="col-span-full mb-6">
        <FilterBar
          categories={categories}
          selectedFilters={selectedFilters}
          onFiltersChange={handleFiltersChange}
        />
      </div>

      <section className="col-span-full w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6">
        {filteredSolutions.length > 0 ? (
          filteredSolutions.map((solution, index) => (
            <div
              key={`${solution.id}-${filterKey}`}
              className="group relative w-full flex flex-col gap-4 p-4 cursor-pointer transition-all ease-circ duration-400 animate-in fade-in slide-in-from-bottom-4"
              style={{
                animationDelay: `${index * 60}ms`,
                animationFillMode: "backwards",
              }}
              onClick={() => router.push(`/realisaties/${solution.slug}`)}
            >
              {/* Image */}
              <div className="relative aspect-5/3 overflow-hidden bg-zinc-100">
                {solution.header_image?.url && (
                  <Image
                    src={solution.header_image.url}
                    alt={solution.header_image.alt || solution.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex flex-col gap-1">
                <h3 className="mb-0! text-lg font-medium">
                  {cleanTitle(solution.name)}
                </h3>
                {solution.subtitle && (
                  <p className="text-sm text-zinc-600 mb-0!">
                    {solution.subtitle}
                  </p>
                )}
              </div>

              {/* Action */}
              <Action
                className="mt-auto opacity-0 translate-y-1.5 blur-xs transition-all duration-600 ease-circ group-hover:opacity-100 group-hover:translate-y-0 group-hover:blur-none"
                href={`/realisaties/${solution.slug}`}
                icon={<InfoIcon />}
                label="Meer informatie"
                variant="secondary"
              />
            </div>
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
