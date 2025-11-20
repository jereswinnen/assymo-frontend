export const dynamic = "force-dynamic";

import { getPageMetadata } from "@/lib/getPageMetadata";
import { client } from "@/sanity/client";
import SectionRenderer from "@/components/SectionRenderer";
import { Calendar1Icon, ListTreeIcon } from "lucide-react";
import { Action } from "@/components/Action";

const PAGE_QUERY = `*[
  _type == "page" && slug.current == "home"
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

const SOLUTIONS_QUERY = `*[
  _type == "solution"
] | order(name asc)[0...3] {
  _id,
  name,
  slug,
  headerImage
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

  return (
    <>
      <header className="col-span-full flex flex-col gap-8">
        <div className="w-[900px] flex flex-col gap-2">
          <h1 className="!mb-0">Houten tuingebouwen op maat.</h1>
          <p className="font-[420] text-xl text-stone-600">
            Bij Assymo zijn we gespecialiseerd in het creëren van hoogwaardige
            maatwerkoplossingen voor uw tuin. Onze passie voor tuinconstructies
            en oog voor detail zorgen ervoor dat elk project perfect aansluit
            bij uw wensen en de unieke kenmerken van uw woning.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Action
            href="/oplossingen"
            icon={<ListTreeIcon />}
            label="Ons aanbod"
          />
          <Action
            href="/contact"
            icon={<Calendar1Icon />}
            label="Maak een afspraak"
            variant="secondary"
          />
        </div>
      </header>

      {page.sections && page.sections.length > 0 && (
        <SectionRenderer sections={page.sections} />
      )}
    </>
  );
}
