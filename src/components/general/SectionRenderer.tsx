import Slideshow from "../sections/Slideshow";
import PageHeader from "../sections/PageHeader";
import { SplitSection } from "../sections/SplitSection";
import UspSection from "../sections/UspSection";
import SolutionsScroller from "../sections/SolutionsScroller";
import FlexibleSection from "../sections/FlexibleSection";
import type { SanityImage } from "@/types/sanity";
import type { FlexibleSectionData } from "../sections/FlexibleSection/types";

// Section type definitions using discriminated unions
// Each section has a _type field that narrows the type in the switch
interface BaseSection {
  _key?: string;
}

interface SlideshowImage {
  _type: "image";
  asset: { _ref: string; _type: "reference" };
  hotspot?: { x: number; y: number };
  alt: string;
  caption?: string;
}

interface SlideshowSection extends BaseSection {
  _type: "slideshow";
  background?: boolean;
  images: SlideshowImage[];
}

interface PageHeaderSection extends BaseSection {
  _type: "pageHeader";
  title: string;
  subtitle?: any[];
  background?: boolean;
  showImage?: boolean;
  showButtons?: boolean;
  buttons?: {
    label: string;
    url: string;
    icon: string;
    variant: "primary" | "secondary";
  }[];
}

interface SplitImage {
  _type: "image";
  asset: { _ref: string; _type: "reference" };
}

interface SplitItem {
  image: SplitImage;
  title: string;
  subtitle?: string;
  href: string;
  action?: {
    label: string;
    icon?: string;
    variant?: "primary" | "secondary";
  };
}

interface SplitSectionType extends BaseSection {
  _type: "splitSection";
  items: [SplitItem, SplitItem];
}

interface UspSectionType extends BaseSection {
  _type: "uspSection";
  heading?: string;
  usps?: {
    icon?: string;
    title: string;
    text?: string;
    link?: string;
  }[];
}

interface SolutionsScrollerSection extends BaseSection {
  _type: "solutionsScroller";
  heading?: string;
  subtitle?: string;
}

type FlexibleSectionType = FlexibleSectionData;

type Section =
  | SlideshowSection
  | PageHeaderSection
  | SplitSectionType
  | UspSectionType
  | SolutionsScrollerSection
  | FlexibleSectionType;

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
            return <Slideshow key={key} section={section} />;

          case "pageHeader":
            return (
              <PageHeader
                key={key}
                section={section}
                headerImage={headerImage}
              />
            );

          case "splitSection":
            return <SplitSection key={key} section={section} />;

          case "uspSection":
            return <UspSection key={key} section={section} />;

          case "solutionsScroller":
            return <SolutionsScroller key={key} section={section} />;

          case "flexibleSection":
            return <FlexibleSection key={key} section={section} />;

          default:
            console.warn(`Unknown section type: ${(section as { _type: string })._type}`);
            return null;
        }
      })}
    </>
  );
}
