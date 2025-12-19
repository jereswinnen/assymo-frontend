import { getPageBySlug } from "@/lib/content";
import type { Metadata } from "next";

export async function getPageMetadata(slug: string): Promise<Metadata> {
  const page = await getPageBySlug(slug);
  return {
    title: page?.title ? `${page.title} — Assymo` : "Assymo",
    description: page?.title
      ? `Read ${page.title} on Assymo.`
      : "Assymo Home Page",
  };
}
