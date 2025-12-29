import { Suspense } from "react";
import { getPageBySlug, getAllSolutions, getFilterCategories } from "@/lib/content";
import SectionRenderer from "@/components/general/SectionRenderer";
import { ProjectsGrid } from "@/components/general/ProjectsGrid";

export const metadata = {
  title: "Realisaties - Assymo",
  description: "Bekijk onze realisaties",
};

export default async function RealisatiesPage() {
  const [page, solutions, categories] = await Promise.all([
    getPageBySlug("realisaties"),
    getAllSolutions(),
    getFilterCategories(),
  ]);

  const sections = (page?.sections || []) as any[];
  const headerImage = page?.header_image as any;

  return (
    <section className="col-span-full grid grid-cols-subgrid gap-y-14">
      {sections.length > 0 && (
        <SectionRenderer sections={sections} headerImage={headerImage} />
      )}

      <Suspense
        fallback={
          <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6">
            {solutions.slice(0, 6).map((solution) => (
              <div key={solution.id} className="flex flex-col gap-4 p-4">
                <div className="aspect-5/3 bg-stone-100 animate-pulse" />
                <div className="flex flex-col gap-2">
                  <div className="h-5 w-3/4 bg-stone-100 animate-pulse rounded" />
                  <div className="h-4 w-1/2 bg-stone-100 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        }
      >
        <ProjectsGrid solutions={solutions as any} categories={categories as any} />
      </Suspense>
    </section>
  );
}
