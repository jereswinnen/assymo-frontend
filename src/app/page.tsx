export const dynamic = "force-dynamic";

import { getPageMetadata } from "@/lib/getPageMetadata";
import { client } from "@/sanity/client";
import { urlFor } from "@/sanity/imageUrl";
import { PortableText } from "@portabletext/react";

const PAGE_QUERY = `*[
  _type == "page" && slug.current == "home"
][0]{_id, title, body, headerImage}`;

export async function generateMetadata() {
  return getPageMetadata("home");
}

export default async function Home() {
  const page = await client.fetch(PAGE_QUERY);

  if (!page) {
    return (
      <section>
        <h1 className="text-4xl font-bold">Home page not found</h1>
      </section>
    );
  }

  return (
    <section className="col-span-full grid grid-cols-subgrid">
      <section className="relative col-span-full h-[55vh]">
        {page.headerImage && (
          <div className="relative h-full">
            <img
              src={urlFor(page.headerImage).url()}
              alt={page.headerImage.alt}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0 bg-black/30 z-10"
              aria-hidden="true"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-white to-white/0 z-20"
              aria-hidden="true"
            />
          </div>
        )}
        <header className="absolute bottom-0 left-0 right-0 z-30 w-[40%]">
          <PortableText value={page.body} />
        </header>
      </section>
    </section>
  );
}
