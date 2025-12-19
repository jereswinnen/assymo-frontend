import { getAllSolutions } from "@/lib/content";
import SolutionsScrollerClient from "./SolutionsScrollerClient";

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
  const solutions = await getAllSolutions();

  // Transform solutions to include image URLs
  const solutionsWithUrls = solutions.map((solution) => ({
    _id: solution.id,
    name: solution.name,
    subtitle: solution.subtitle ?? undefined,
    slug: { current: solution.slug },
    imageUrl: solution.header_image?.url,
    imageAlt: solution.header_image?.alt,
  }));

  return (
    <SolutionsScrollerClient
      heading={section.heading}
      subtitle={section.subtitle}
      solutions={solutionsWithUrls}
    />
  );
}
