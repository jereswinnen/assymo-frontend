export const dynamic = "force-dynamic";

import { getPageMetadata } from "@/lib/getPageMetadata";
import { client } from "@/sanity/client";
import { urlFor } from "@/sanity/imageUrl";
import { PortableText } from "@portabletext/react";
import Link from "next/link";
import SolutionCard from "@/components/SolutionCard";
import SectionUSPs from "@/components/SectionUSPs";
import SectionRenderer from "@/components/SectionRenderer";
import { BookmarkIcon, SquareTerminalIcon } from "lucide-react";

const PAGE_QUERY = `*[
  _type == "page" && slug.current == "home"
][0]{
  _id,
  title,
  body,
  headerImage,
  sections[]{
    _type,
    _key,
    heading,
    image{
      asset,
      hotspot,
      alt
    },
    images[]{
      asset,
      hotspot,
      alt,
      caption
    },
    products[]->{
      _id,
      name,
      slug,
      headerImage{
        asset,
        hotspot,
        alt
      }
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

const SOLUTIONS_QUERY = `*[
  _type == "solution"
] | order(name asc)[0...3] {
  _id,
  name,
  slug,
  headerImage
}`;

export async function generateMetadata() {
  return getPageMetadata("home");
}

export default async function HomePage() {
  const page = await client.fetch(PAGE_QUERY);
  const solutions = await client.fetch(SOLUTIONS_QUERY);

  if (!page) {
    return (
      <section>
        <h1 className="text-4xl font-bold">Home page not found</h1>
      </section>
    );
  }

  return (
    <>
      <div className="col-span-full flex items-center justify-end gap-4">
        <a
          href="#"
          className="w-fit px-3.5 py-2 flex items-center gap-1.5 text-sm font-medium text-accent-light bg-accent-dark rounded-full transition-colors duration-250 hover:text-accent-dark hover:bg-accent-light"
        >
          <SquareTerminalIcon className="size-4" />
          Solutions
        </a>

        <a
          href="#"
          className="w-fit px-3.5 py-2 flex items-center gap-1.5 text-sm font-medium text-stone-700 bg-stone-200 rounded-full transition-colors duration-250 hover:text-stone-800 hover:bg-stone-300"
        >
          <BookmarkIcon className="size-4" />
          Solutions
        </a>
      </div>

      {page.sections && page.sections.length > 0 && (
        <SectionRenderer sections={page.sections} />
      )}
    </>
  );
}
