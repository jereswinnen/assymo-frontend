export const dynamic = "force-dynamic";

import { getPageMetadata } from "@/lib/getPageMetadata";
import { client } from "@/sanity/client";
import { urlFor } from "@/sanity/imageUrl";
import { PortableText } from "@portabletext/react";
import { notFound } from "next/navigation";

const SOLUTIONS_QUERY = `*[
  _type == "solution" && slug.current == $slug
][0]{
  _id,
  name,
  slug,
  headerImage,
  body
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
    <section className="col-span-full grid grid-cols-subgrid">
      <article className="col-span-4 col-start-3">
        {solution.headerImage && (
          <img
            src={urlFor(solution.headerImage).url()}
            alt={solution.headerImage.alt || solution.name || "Solution image"}
            className="w-full h-auto mb-8 rounded-lg"
          />
        )}
        <h1 className="text-4xl font-bold mb-8">
          {solution.name || "Untitled Solution"}
        </h1>
        {solution.body && (
          <div className="prose max-w-none">
            <PortableText value={solution.body} />
          </div>
        )}
      </article>
    </section>
  );
}
