"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";
import Image from "next/image";
import { urlFor } from "@/sanity/imageUrl";
import { FilterBar } from "@/components/FilterBar";
import { Action } from "@/components/Action";
import { InfoIcon } from "lucide-react";

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
  subtitle?: string;
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
    [router, pathname],
  );

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
            filter.category.slug.current === categorySlug &&
            selectedOptions.includes(filter.slug.current),
        );
      });
    });
  }, [solutions, selectedFilters]);

  const hasActiveFilters = Object.values(selectedFilters).some(
    (options) => options.length > 0,
  );

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
          filteredSolutions.map((solution) => (
            <div
              key={solution._id}
              className="group relative w-full flex flex-col gap-4 p-4 transition-all ease-circ duration-300"
            >
              {/* Image */}
              <div className="relative aspect-5/3 overflow-hidden bg-stone-100">
                {solution.headerImage && (
                  <Image
                    src={urlFor(solution.headerImage).url()}
                    alt={solution.headerImage.alt || solution.name}
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
                  <p className="text-sm text-stone-600 mb-0!">
                    {solution.subtitle}
                  </p>
                )}
              </div>

              {/* Action */}
              <Action
                className="mt-auto opacity-0 translate-y-1.5 blur-xs transition-all duration-600 ease-circ group-hover:opacity-100 group-hover:translate-y-0 group-hover:blur-none"
                href={`/realisaties/${solution.slug.current}`}
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
