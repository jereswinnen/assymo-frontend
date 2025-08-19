export const dynamic = "force-dynamic";

import { client } from "@/sanity/client";
import { notFound } from "next/navigation";
import SectionRenderer from "@/components/SectionRenderer";

const SOLUTIONS_QUERY = `*[
  _type == "solution" && slug.current == $slug
][0]{
  _id,
  name,
  slug,
  headerImage,
  body,
  sections[]{
    _type,
    _key,
    heading,
    image{
      asset,
      hotspot,
      alt
    },
    content{
      heading,
      body,
      cta{
        text,
        url
      }
    }
  }
}`;

export async function generateMetadata({ params }: any) {
  const solution = await client.fetch(SOLUTIONS_QUERY, { slug: params.slug });

  if (!solution) {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: solution.name || "Solution",
    description: `View details about ${solution.name || "our solution"}`,
  };
}

export default async function SolutionPage({ params }: any) {
  const solution = await client.fetch(SOLUTIONS_QUERY, { slug: params.slug });

  if (!solution) {
    notFound();
  }

  return (
    <section className="px-container-sm md:px-container-md col-span-full grid grid-cols-subgrid gap-y-14">
      {solution.sections && solution.sections.length > 0 && (
        <SectionRenderer sections={solution.sections} />
      )}
    </section>
  );
}
