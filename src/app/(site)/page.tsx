export const dynamic = "force-dynamic";

import { getPageMetadata } from "@/lib/getPageMetadata";
import { client } from "@/sanity/client";
import { sectionsFragment } from "@/sanity/fragments";
import SectionRenderer from "@/components/SectionRenderer";
import { SplitSection } from "@/components/SplitSection";

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

  const splitItems: [
    {
      image: string;
      alt: string;
      href: string;
      title?: string;
      subtitle?: string;
    },
    {
      image: string;
      alt: string;
      href: string;
      title?: string;
      subtitle?: string;
    },
  ] = [
    {
      image:
        "https://assymo-frontend.vercel.app/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fnaj44gzh%2Fproduction%2F8d334e6e8a5b932f93c5b09990e6f40cce2d7d6e-2000x1500.jpg&w=1920&q=75",
      alt: "Bekijk onze exterieur oplossingen",
      href: "/oplossingen",
      title: "Exterieur",
      subtitle: "Ontdek onze collectie",
    },
    {
      image:
        "https://images.unsplash.com/photo-1622372738946-62e02505feb3?q=80&w=2264&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      alt: "Bekijk onze interieur oplossingen",
      href: "/oplossingen",
      title: "Interieur",
      subtitle: "Persoonlijk advies",
    },
  ];

  return (
    <>
      <SplitSection items={splitItems} className="col-span-full" />
      {page.sections && page.sections.length > 0 && (
        <SectionRenderer sections={page.sections} />
      )}
    </>
  );
}
