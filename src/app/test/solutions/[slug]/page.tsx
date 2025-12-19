import { getSolutionBySlug } from "@/lib/content";
import { notFound } from "next/navigation";
import SectionRenderer from "@/components/general/SectionRenderer";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function TestSolution({ params }: Props) {
  const { slug } = await params;
  const solution = await getSolutionBySlug(slug);

  if (!solution) {
    notFound();
  }

  // Cast types - Postgres schema matches Sanity structure
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sections = (solution.sections || []) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const headerImage = solution.header_image as any;

  return (
    <div className="min-h-screen">
      <div className="bg-yellow-100 text-yellow-800 text-center py-2 text-sm font-medium">
        TEST MODE - Data from Postgres CMS
      </div>
      <SectionRenderer sections={sections} headerImage={headerImage} />
    </div>
  );
}
