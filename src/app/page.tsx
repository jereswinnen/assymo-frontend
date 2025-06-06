export const dynamic = "force-dynamic";

import { getPageMetadata } from "@/lib/getPageMetadata";
import { client } from "@/sanity/client";
import { urlFor } from "@/sanity/imageUrl";
import { PortableText } from "@portabletext/react";
import Image from "next/image";

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
      <main className="container mx-auto min-h-screen max-w-3xl p-8">
        <h1 className="text-4xl font-bold mb-8">Home page not found</h1>
      </main>
    );
  }

  return (
    <main className="container mx-auto min-h-screen max-w-3xl p-8">
      {page.headerImage && (
        <img src={urlFor(page.headerImage).url()} alt={page.headerImage.alt} />
      )}
      <h1 className="text-4xl font-bold mb-8">{page.title}</h1>
      <PortableText value={page.body} />
    </main>
  );
}
