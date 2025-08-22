export const dynamic = "force-dynamic";

import { getPageMetadata } from "@/lib/getPageMetadata";
import { client } from "@/sanity/client";
import { urlFor } from "@/sanity/imageUrl";
import { PortableText } from "@portabletext/react";
import Link from "next/link";
import SolutionCard from "@/components/SolutionCard";
import SectionUSPs from "@/components/SectionUSPs";
import SectionRenderer from "@/components/SectionRenderer";

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
      <section className="hidden relative col-span-full h-[55vh]">
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
        <header className="absolute bottom-0 left-0 right-0 z-30 p-container-sm md:p-container-md w-full lg:w-[50%]">
          <PortableText value={page.body} />
        </header>
      </section>

      <section className="hidden px-conainer-sm md:px-conainer-md col-span-full gid grid-cols-subgrid">
        <header className="col-span-full mb-6 flex items-center justify-between">
          <h4>Een greep uit ons aanbod</h4>
          {/* <Link
            href="/oplossingen"
            className="text-blue-600 hover:underline font-medium"
          >
            Bekijk alle oplossingen
          </Link> */}
        </header>
        <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-10">
          {solutions.map((solution: any) => (
            <SolutionCard key={solution._id} solution={solution} />
          ))}
        </div>
      </section>

      {page.sections && page.sections.length > 0 && (
        <SectionRenderer sections={page.sections} />
      )}

      {/* <SectionUSPs /> */}
    </>
  );
}
