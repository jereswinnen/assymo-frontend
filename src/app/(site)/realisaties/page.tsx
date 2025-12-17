export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { client } from "@/sanity/client";
import { sectionsFragment, imageFields } from "@/sanity/fragments";
import SectionRenderer from "@/components/general/SectionRenderer";
import { ProjectsGrid } from "@/components/general/ProjectsGrid";

const PAGE_QUERY = `*[
  _type == "page" && slug.current == "realisaties"
][0]{
  _id,
  title,
  body,
  headerImage,
  ${sectionsFragment}
}`;

const SOLUTIONS_QUERY = `*[
  _type == "solution"
] | order(orderRank asc) {
  _id,
  name,
  subtitle,
  slug,
  headerImage{
    ${imageFields}
  },
  "filters": filters[]-> {
    _id,
    name,
    slug,
    "category": category-> {
      _id,
      name,
      slug
    }
  }
}`;

const CATEGORIES_QUERY = `*[
  _type == "filterCategory"
] | order(orderRank asc) {
  _id,
  name,
  slug,
  "options": *[_type == "filterOption" && references(^._id)] | order(orderRank asc) {
    _id,
    name,
    slug
  }
}`;

export const metadata = {
  title: "Realisaties - Assymo",
  description: "Bekijk onze realisaties",
};

export default async function RealisatiesPage() {
  const [page, solutions, categories] = await Promise.all([
    client.fetch(PAGE_QUERY),
    client.fetch(SOLUTIONS_QUERY),
    client.fetch(CATEGORIES_QUERY),
  ]);

  return (
    <section className="col-span-full grid grid-cols-subgrid gap-y-14">
      {page?.sections && page.sections.length > 0 && (
        <SectionRenderer
          sections={page.sections}
          headerImage={page.headerImage}
        />
      )}

      <Suspense
        fallback={
          <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6">
            {solutions.slice(0, 6).map((solution: { _id: string }) => (
              <div key={solution._id} className="flex flex-col gap-4 p-4">
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
        <ProjectsGrid solutions={solutions} categories={categories} />
      </Suspense>
    </section>
  );
}
