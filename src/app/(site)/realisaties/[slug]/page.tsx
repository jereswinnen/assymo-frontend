import { getSolutionBySlug } from "@/lib/content";
import { notFound } from "next/navigation";
import SectionRenderer from "@/components/shared/SectionRenderer";

export async function generateMetadata({ params }: any) {
  const { slug } = await params;
  const solution = await getSolutionBySlug(slug);

  if (!solution) {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: solution.name || "Solution",
    description: `View details about ${solution.name || "our solution"}`,
  };
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
