import TextLeftImageRight from "./sections/TextLeftImageRight";
import TextRightImageLeft from "./sections/TextRightImageLeft";
import Map from "./sections/Map";
import TextCentered from "./sections/TextCentered";
import Slideshow from "./sections/Slideshow";
import SlideshowLeftTextRight from "./sections/SlideshowLeftTextRight";
import SlideshowRightTextLeft from "./sections/SlideshowRightTextLeft";
import TextLeftImageGridRight from "./sections/TextLeftImageGridRight";
import TextRightImageGridLeft from "./sections/TextRightImageGridLeft";
import SalonizedBookingSection from "./sections/SalonizedBookingSection";
import ContactForm from "./sections/ContactForm";
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
          case "textLeftImageRight":
            return <TextLeftImageRight key={key} section={section as any} />;

          case "textRightImageLeft":
            return <TextRightImageLeft key={key} section={section as any} />;

          case "kaart":
            return <Map key={key} section={section as any} />;

          case "textCentered":
            return <TextCentered key={key} section={section as any} />;

          case "slideshow":
            return <Slideshow key={key} section={section as any} />;

          case "slideshowLeftTextRight":
            return (
              <SlideshowLeftTextRight key={key} section={section as any} />
            );

          case "slideshowRightTextLeft":
            return (
              <SlideshowRightTextLeft key={key} section={section as any} />
            );

          case "kalender":
            return (
              <SalonizedBookingSection
                key={key}
                heading={(section as any).heading}
              />
            );
          case "contactForm":
            return <ContactForm key={key} section={section as any} />;
          case "textLeftImageGridRight":
            return (
              <TextLeftImageGridRight key={key} section={section as any} />
            );
          case "textRightImageGridLeft":
            return (
              <TextRightImageGridLeft key={key} section={section as any} />
            );

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
