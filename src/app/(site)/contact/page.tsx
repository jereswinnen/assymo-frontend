export const dynamic = "force-dynamic";

import { getPageMetadata } from "@/lib/getPageMetadata";
import { client } from "@/sanity/client";
import { urlFor } from "@/sanity/imageUrl";
import { PortableText } from "@portabletext/react";
import Link from "next/link";
import SectionRenderer from "@/components/SectionRenderer";

const PAGE_QUERY = `*[
  _type == "page" && slug.current == "contact"
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

export async function generateMetadata() {
  return getPageMetadata("contact");
}

export default async function ContactPage() {
  const page = await client.fetch(PAGE_QUERY);

  if (!page) {
    return (
      <section>
        <h1 className="text-4xl font-bold">Contact page not found</h1>
      </section>
    );
  }

  return (
    <section className="px-conainer-sm md:px-conainer-md col-span-full grid grid-cols-subgrid gap-y-14">
      {page.sections && page.sections.length > 0 && (
        <SectionRenderer sections={page.sections} />
      )}
    </section>
  );
}
