"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";
import Link from "next/link";
import { urlFor } from "@/sanity/imageUrl";
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

interface ProjectsGridProps {
  solutions: Solution[];
  categories: CategoryWithOptions[];
}

function ProjectCard({ solution }: { solution: Solution }) {
  const cleanTitle = (title: string) => {
    return title.replace(/^\d+_/, "");
  };

  return (
    <Link
      href={`/realisaties/${solution.slug.current}`}
      className="group bg-white p-3 rounded-2xl shadow-sm flex flex-col items-center gap-3 overflow-hidden transition-all duration-300 hover:scale-[1.025] hover:shadow-md"
    >
      {solution.headerImage && (
        <div className="w-full overflow-hidden rounded-lg">
          <img
            src={urlFor(solution.headerImage).url()}
            alt={solution.headerImage.alt || solution.name}
            className="group-hover:scale-105 rounded-lg object-cover max-h-[280px] w-full transition-all duration-700"
          />
        </div>
      )}
      <span className="text-base font-medium px-3 p-1 bg-(--c-accent-dark)/15 rounded-full">
        {cleanTitle(solution.name)}
      </span>
    </Link>
  );
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
            <ProjectCard key={solution._id} solution={solution} />
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
