import { getHomepage } from "@/lib/content";
import SectionRenderer from "@/components/shared/SectionRenderer";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/getPageMetadata";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getHomepage();
  return buildMetadata({
    title: page?.meta_title || page?.title,
    description: page?.meta_description,
    path: "/",
    image: (page?.header_image as any)?.url,
  });
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
