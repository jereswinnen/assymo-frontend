import { client } from "@/sanity/client";
import { urlFor } from "@/sanity/imageUrl";
import SolutionsScrollerClient from "./SolutionsScrollerClient";

// Query to fetch all solutions
const SOLUTIONS_QUERY = `*[_type == "solution"] | order(name asc) {
  _id,
  name,
  subtitle,
  slug,
  headerImage {
    asset,
    hotspot,
    alt
  }
}`;

export interface Solution {
  _id: string;
  name: string;
  subtitle?: string;
  slug: { current: string };
  headerImage?: {
    asset: { _ref: string; _type: "reference" };
    hotspot?: { x: number; y: number };
    alt?: string;
  };
}

interface SolutionsScrollerProps {
  section: {
    _type: "solutionsScroller";
    heading?: string;
    subtitle?: string;
  };
}

export default async function SolutionsScroller({
  section,
}: SolutionsScrollerProps) {
  const solutions: Solution[] = await client.fetch(SOLUTIONS_QUERY);

  // Transform solutions to include image URLs
  const solutionsWithUrls = solutions.map((solution) => ({
    _id: solution._id,
    name: solution.name,
    subtitle: solution.subtitle,
    slug: solution.slug,
    imageUrl: solution.headerImage
      ? urlFor(solution.headerImage as any).url()
      : undefined,
    imageAlt: solution.headerImage?.alt,
  }));

  return (
    <SolutionsScrollerClient
      heading={section.heading}
      subtitle={section.subtitle}
      solutions={solutionsWithUrls}
    />
  );
}
