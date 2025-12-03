import Slideshow from "./sections/Slideshow";
import PageHeader from "./sections/PageHeader";
import { SplitSection } from "./sections/SplitSection";
import UspSection from "./sections/UspSection";
import SolutionsScroller from "./sections/SolutionsScroller";
import type { SanityImage, SanityImageWithCaption } from "@/types/sanity";

interface Section {
  _type: string;
  _key?: string;
  heading?: string;
  image?: SanityImage;
  images?: SanityImageWithCaption[];
  projects?: {
    _id: string;
    name: string;
    slug: { current: string };
    headerImage?: SanityImage;
  }[];
  content?: {
    heading: string;
    body?: any[];
    cta?: {
      text: string;
      url: string;
    };
  };
}

interface SectionRendererProps {
  sections: Section[];
  headerImage?: SanityImage;
}

export default function SectionRenderer({
  sections,
  headerImage,
}: SectionRendererProps) {
  return (
    <>
      {sections.map((section, index) => {
        const key = section._key || `section-${index}`;

        switch (section._type) {
          case "slideshow":
            return <Slideshow key={key} section={section as any} />;

          case "pageHeader":
            return (
              <PageHeader
                key={key}
                section={section as any}
                headerImage={headerImage}
              />
            );

          case "splitSection":
            return <SplitSection key={key} section={section as any} />;

          case "uspSection":
            return <UspSection key={key} section={section as any} />;

          case "solutionsScroller":
            return <SolutionsScroller key={key} section={section as any} />;

          default:
            console.warn(`Unknown section type: ${section._type}`);
            return null;
        }
      })}
    </>
  );
}
