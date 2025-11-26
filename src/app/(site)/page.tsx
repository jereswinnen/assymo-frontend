export const dynamic = "force-dynamic";

import { getPageMetadata } from "@/lib/getPageMetadata";
import { client } from "@/sanity/client";
import { sectionsFragment } from "@/sanity/fragments";
import SectionRenderer from "@/components/SectionRenderer";
import SolutionsScroller from "@/components/sections/SolutionsScroller";

const PAGE_QUERY = `*[
  _type == "page" && slug.current == "home"
][0]{
  _id,
  title,
  body,
  headerImage,
  ${sectionsFragment}
}`;

export async function generateMetadata() {
  return getPageMetadata("home");
}

export default async function HomePage() {
  const page = await client.fetch(PAGE_QUERY);

  if (!page) {
    return (
      <section>
        <h1 className="text-4xl font-bold">Home page not found</h1>
      </section>
    );
  }

  return (
    <>
      <SolutionsScroller
        section={{ _type: "solutionsScroller", heading: "Ons aanbod" }}
      />
      {page.sections && page.sections.length > 0 && (
        <SectionRenderer sections={page.sections} />
      )}
    </>
  );
}
