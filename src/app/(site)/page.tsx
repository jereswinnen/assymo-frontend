export const dynamic = "force-dynamic";

import { getPageMetadata } from "@/lib/getPageMetadata";
import { client } from "@/sanity/client";
import { sectionsFragment } from "@/sanity/fragments";
import SectionRenderer from "@/components/SectionRenderer";
import { Separator } from "@/components/ui/separator";
import { ListTreeIcon, PhoneIcon } from "lucide-react";

const PAGE_QUERY = `*[
  _type == "page" && slug.current == "home"
][0]{
  _id,
  title,
  body,
  headerImage,
  ${sectionsFragment}
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
      <div className="col-span-full flex gap-8">
        <figure className="w-3xs">
          <img
            src="https://images.unsplash.com/photo-1599696848652-f0ff23bc911f?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt=""
          />
        </figure>
        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium text-stone-600">Ontdek</span>
          <ul className="flex flex-col gap-1 text-2xl font-semibold [&>*>*]:block [&>*>*]:transition-all [&>*>*]:duration-300 [&>*>*]:hover:translate-x-2">
            <li>
              <a href="#">Trappen</a>
            </li>
            <li>
              <a href="#">Badkamer</a>
            </li>
            <li>
              <a href="#">Keuken</a>
            </li>
            <li>
              <a href="#">Bureau</a>
            </li>
            <li>
              <a href="#">Meubilair</a>
            </li>
          </ul>
        </div>
        <div className="ml-auto flex flex-col gap-2">
          <span className="text-xs font-medium text-stone-600">Contacteer</span>
          <div className="flex flex-col gap-4">
            <ul className="flex flex-col gap-2 text-base font-medium">
              <li>
                Eikenlei 159,<br></br>2960 Sint-Job-in-&apos;t-Goor
              </li>
              <li className="flex items-center gap-2">
                <PhoneIcon className="size-4" />
                <a href="#">+32 (0) 3 434 74 98</a>
              </li>
            </ul>
            <Separator />
            <ul className="flex flex-col gap-1 text-sm font-medium">
              <li>
                <a href="#">Instagram</a>
              </li>
              <li>
                <a href="#">Facebook</a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {page.sections && page.sections.length > 0 && (
        <SectionRenderer sections={page.sections} />
      )}
    </>
  );
}
