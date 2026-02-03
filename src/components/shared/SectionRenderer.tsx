import Slideshow from "../sections/SlideshowSection";
import PageHeader from "../sections/PageHeader";
import { SplitSection } from "../sections/SplitSection";
import UspSection from "../sections/UspSection";
import SolutionsScroller from "../sections/SolutionsScroller";
import FlexibleSection from "../sections/FlexibleSection";
import SolutionHighlight from "../sections/SolutionHighlight";
import type { FlexibleSectionData } from "../sections/FlexibleSection/types";

// Image type with direct URL
interface ImageWithUrl {
  url: string;
  alt?: string;
}

// Section type definitions using discriminated unions
// Each section has a _type field that narrows the type in the switch
interface BaseSection {
  _key?: string;
}

interface SlideshowImage {
  _key: string;
  image: { url: string; alt?: string };
  caption?: string;
}

interface SlideshowSection extends BaseSection {
  _type: "slideshow";
  background?: boolean;
  images?: SlideshowImage[];
}

interface PageHeaderSection extends BaseSection {
  _type: "pageHeader";
  title: string;
  subtitle?: string;
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

interface SplitItem {
  image?: ImageWithUrl;
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
    link?: {
      label?: string;
      url?: string;
    };
  }[];
}

interface SolutionsScrollerSection extends BaseSection {
  _type: "solutionsScroller";
  heading?: string;
  subtitle?: string;
}

interface SolutionHighlightSection extends BaseSection {
  _type: "solutionHighlight";
  solutionId?: string;
  subtitle?: string;
}

type FlexibleSectionType = FlexibleSectionData;

type Section =
  | SlideshowSection
  | PageHeaderSection
  | SplitSectionType
  | UspSectionType
  | SolutionsScrollerSection
  | FlexibleSectionType
  | SolutionHighlightSection;

interface SectionRendererProps {
  sections: Section[];
  headerImage?: ImageWithUrl;
  /** Solution name to pass to form blocks for pre-selecting product */
  solutionName?: string;
  /** Configurator category slug to pass to sections with openConfigurator action */
  configuratorCategorySlug?: string | null;
}

export default function SectionRenderer({
  sections,
  headerImage,
  solutionName,
  configuratorCategorySlug,
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
                configuratorCategorySlug={configuratorCategorySlug}
              />
            );

          case "splitSection":
            return <SplitSection key={key} section={section} configuratorCategorySlug={configuratorCategorySlug} />;

          case "uspSection":
            return <UspSection key={key} section={section} />;

          case "solutionsScroller":
            return <SolutionsScroller key={key} section={section} />;

          case "flexibleSection":
            return <FlexibleSection key={key} section={section} solutionName={solutionName} configuratorCategorySlug={configuratorCategorySlug} />;

          case "solutionHighlight":
            return <SolutionHighlight key={key} section={section} />;

          default:
            console.warn(`Unknown section type: ${(section as { _type: string })._type}`);
            return null;
        }
      })}
    </>
  );
}
