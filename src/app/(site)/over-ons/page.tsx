import { getPageMetadata } from "@/lib/getPageMetadata";
import { getPageBySlug } from "@/lib/content";
import SectionRenderer from "@/components/shared/SectionRenderer";

export async function generateMetadata() {
  return getPageMetadata("over-ons");
}

export default async function AboutPage() {
  const page = await getPageBySlug("over-ons");

  if (!page) {
    return (
      <section>
        <h1 className="text-4xl font-bold">Over ons page not found</h1>
      </section>
    );
  }

  const sections = (page.sections || []) as any[];
  const headerImage = page.header_image as any;

  return (
    <section className="col-span-full grid grid-cols-subgrid">
      {/* Modular Sections */}
      {sections.length > 0 && (
        <SectionRenderer sections={sections} headerImage={headerImage} />
      )}
    </section>
  );
}
