export const dynamic = "force-dynamic";

import { getPageMetadata } from "@/lib/getPageMetadata";
import { client } from "@/sanity/client";
import { urlFor } from "@/sanity/imageUrl";
import { PortableText } from "@portabletext/react";
import Link from "next/link";
import SectionRenderer from "@/components/SectionRenderer";

const PAGE_QUERY = `*[
  _type == "page" && slug.current == "contact"
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

export async function generateMetadata() {
  return getPageMetadata("contact");
}

export default async function ContactPage() {
  const page = await client.fetch(PAGE_QUERY);

  if (!page) {
    return (
      <section>
        <h1 className="text-4xl font-bold">Contact page not found</h1>
      </section>
    );
  }

  return (
    <section className="px-container-sm md:px-container-md col-span-full grid grid-cols-subgrid gap-y-14">
      <header className="col-span-full grid grid-cols-subgrid gap-y-8 md:gap-y-0">
        {page.headerImage && (
          <img
            className="col-span-full md:col-span-4 rounded-2xl"
            src={urlFor(page.headerImage).url()}
            alt={page.headerImage.alt}
          />
        )}
        <article className="col-span-full md:col-span-4 flex flex-col gap-10">
          <div>
            <PortableText value={page.body} />
          </div>
          <ul className="flex flex-col gap-3">
            <li>
              <b>Directe ervaring:</b>
              <p>
                Zie en voel de materialen en afwerkingen van onze constructies.
              </p>
            </li>
            <li>
              <b>Persoonlijk advies:</b>
              <p>
                Ontvang deskundig advies van onze specialisten die u kunnen
                helpen bij het maken van de juiste keuzes.
              </p>
            </li>
            <li>
              <b>Inspiratie:</b>
              <p>
                Ontdek verschillende stijlen en mogelijkheden die perfect passen
                bij uw wensen en behoeften.
              </p>
            </li>
          </ul>
          <Link href="/contact" className="c-action w-fit">
            Maak een afspraak
          </Link>
        </article>
      </header>

      <section className="col-span-full">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2494.7701096004157!2d4.5515631767177185!3d51.296954526055174!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c4079edda859cd%3A0xc9fca4c624e41481!2sAssymo%20Tuinconstructies%20op%20maat!5e0!3m2!1sen!2sbe!4v1751622544119!5m2!1sen!2sbe"
          width="100%"
          height="450"
          loading="lazy"
        ></iframe>
      </section>

      {/* Modular Sections */}
      {page.sections && page.sections.length > 0 && (
        <SectionRenderer sections={page.sections} />
      )}
    </section>
  );
}
