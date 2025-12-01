export const dynamic = "force-dynamic";

import { getPageMetadata } from "@/lib/getPageMetadata";
import { client } from "@/sanity/client";
import { sectionsFragment } from "@/sanity/fragments";
import { urlFor } from "@/sanity/imageUrl";
import { PortableText } from "@portabletext/react";
import SectionRenderer from "@/components/SectionRenderer";

const PAGE_QUERY = `*[
  _type == "page" && slug.current == "over-ons"
][0]{
  _id,
  title,
  body,
  headerImage,
  ${sectionsFragment}
}`;

export async function generateMetadata() {
  return getPageMetadata("over-ons");
}

export default async function AboutPage() {
  const page = await client.fetch(PAGE_QUERY);

  if (!page) {
    return (
      <section>
        <h1 className="text-4xl font-bold">Over ons page not found</h1>
      </section>
    );
  }

  return (
    <section className="col-span-full grid grid-cols-subgrid">
      {page.headerImage && (
        <img
          className="col-span-3"
          src={urlFor(page.headerImage).url()}
          alt={page.headerImage.alt}
        />
      )}
      <article className="col-span-5">
        <PortableText value={page.body} />
      </article>

      {/* Modular Sections */}
      {page.sections && page.sections.length > 0 && (
        <SectionRenderer sections={page.sections} headerImage={page.headerImage} />
      )}
    </section>
  );
}
