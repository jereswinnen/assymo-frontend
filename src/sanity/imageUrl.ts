import imageUrlBuilder from "@sanity/image-url";
import { client } from "./client";
import type { SanityImage } from "@/types/sanity";

const builder = imageUrlBuilder(client);

export function urlFor(source: SanityImage) {
  return builder.image(source);
}
