import { getPageMetadata } from "@/lib/getPageMetadata";
import { getPageBySlug } from "@/lib/content";
import SectionRenderer from "@/components/general/SectionRenderer";

export async function generateMetadata() {
  return getPageMetadata("contact");
}

export default async function ContactPage() {
  const page = await getPageBySlug("contact");

  if (!page) {
    return (
      <section>
        <h1 className="text-4xl font-bold">Contact page not found</h1>
      </section>
    );
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
