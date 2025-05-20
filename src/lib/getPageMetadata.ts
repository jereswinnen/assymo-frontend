import { client } from "@/sanity/client";
import type { Metadata } from "next";

const PAGE_QUERY = `*[
  _type == "page" && slug.current == $slug
][0]{_id, title, body}`;

export async function getPageMetadata(slug: string): Promise<Metadata> {
  const page = await client.fetch(PAGE_QUERY, { slug });
  return {
    title: page?.title ? `${page.title} — Assymo` : "Assymo",
    description: page?.title
      ? `Read ${page.title} on Assymo.`
      : "Assymo Home Page",
  };
}
