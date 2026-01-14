import { getSolutionBySlug } from "@/lib/content";
import { notFound } from "next/navigation";
import SectionRenderer from "@/components/shared/SectionRenderer";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/getPageMetadata";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const solution = await getSolutionBySlug(slug);

  if (!solution) {
    return { title: "Realisatie niet gevonden — Assymo" };
  }

  return buildMetadata({
    title: solution.name,
    path: `/realisaties/${slug}`,
    image: (solution.header_image as any)?.url,
    type: "article",
  });
}

export default async function SolutionPage({ params }: any) {
  const { slug } = await params;
  const solution = await getSolutionBySlug(slug);

  if (!solution) {
    notFound();
  }

  const sections = (solution.sections || []) as any[];
  const headerImage = solution.header_image as any;

  return (
    <section className="col-span-full grid grid-cols-subgrid gap-y-14! md:gap-y-24!">
      {sections.length > 0 && (
        <SectionRenderer sections={sections} headerImage={headerImage} />
      )}
    </section>
  );
}
