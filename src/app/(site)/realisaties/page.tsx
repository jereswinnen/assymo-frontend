export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { client } from "@/sanity/client";
import { SolutionsGrid } from "@/components/SolutionsGrid";

const SOLUTIONS_QUERY = `*[
  _type == "solution"
] | order(name asc) {
  _id,
  name,
  slug,
  headerImage,
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
] | order(order asc) {
  _id,
  name,
  slug,
  "options": *[_type == "filterOption" && references(^._id)] | order(order asc) {
    _id,
    name,
    slug
  }
}`;

export const metadata = {
  title: "Oplossingen",
  description: "Bekijk onze oplossingen",
};

export default async function SolutionsPage() {
  const [solutions, categories] = await Promise.all([
    client.fetch(SOLUTIONS_QUERY),
    client.fetch(CATEGORIES_QUERY),
  ]);

  return (
    <section className="col-span-full grid grid-cols-subgrid">
      <header className="col-span-full">
        <h1>
          Onze <b>oplossingen</b>
        </h1>
      </header>
      <div className="col-span-full grid grid-cols-subgrid">
        <Suspense fallback={<div>Laden...</div>}>
          <SolutionsGrid solutions={solutions} categories={categories} />
        </Suspense>
      </div>
    </section>
  );
}
