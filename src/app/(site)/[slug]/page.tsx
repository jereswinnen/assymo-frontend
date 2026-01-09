import { notFound } from "next/navigation";
import { getPageBySlug } from "@/lib/content";
import SectionRenderer from "@/components/shared/SectionRenderer";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);

  if (!page) {
    return { title: "Page Not Found" };
  }

  return {
    title: page.title ? `${page.title} — Assymo` : "Assymo",
    description: page.title
      ? `Read ${page.title} on Assymo.`
      : "Assymo Home Page",
  };
}

export default async function DynamicPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);

  if (!page) {
    notFound();
  }

  const sections = (page.sections || []) as any[];
  const headerImage = page.header_image as any;

  return (
    <section className="col-span-full grid grid-cols-subgrid gap-y-14">
      {sections.length > 0 && (
        <SectionRenderer sections={sections} headerImage={headerImage} />
      )}
    </section>
  );
}
