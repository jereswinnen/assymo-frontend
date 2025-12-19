export const dynamic = "force-dynamic";

import { getHomepage } from "@/lib/content";
import SectionRenderer from "@/components/general/SectionRenderer";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getHomepage();
  return {
    title: page?.title ? `${page.title} — Assymo` : "Assymo",
  };
}

export default async function HomePage() {
  const page = await getHomepage();

  if (!page) {
    return (
      <section>
        <h1 className="text-4xl font-bold">Home page not found</h1>
      </section>
    );
  }

  const sections = (page.sections || []) as any[];
  const headerImage = page.header_image as any;

  return (
    <>
      {sections.length > 0 && (
        <SectionRenderer sections={sections} headerImage={headerImage} />
      )}
    </>
  );
}
