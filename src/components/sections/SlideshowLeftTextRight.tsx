import { PortableText } from "@portabletext/react";
import Link from "next/link";
import SlideshowComponent from "@/components/Slideshow";

interface SlideshowImage {
  _type: "image";
  asset: { _ref: string; _type: "reference" };
  hotspot?: { x: number; y: number };
  alt: string;
  caption?: string;
}

interface SlideshowLeftTextRightProps {
  section: {
    _type: "slideshowLeftTextRight";
    images: SlideshowImage[];
    content: {
      heading: string;
      body?: any[];
      cta?: {
        text: string;
        url: string;
      };
    };
  };
}

export default function SlideshowLeftTextRight({
  section,
}: SlideshowLeftTextRightProps) {
  if (!section.content) return null;

  return (
    <section className="col-span-full grid grid-cols-subgrid gap-y-8 md:gap-y-0">
      {/* Slideshow - Right Side */}
      <div className="col-span-full md:col-span-4">
        {section.images && section.images.length > 0 ? (
          <SlideshowComponent images={section.images} />
        ) : (
          <div className="p-4 bg-yellow-100 text-center rounded-lg">
            <h3 className="font-semibold mb-2">Slideshow</h3>
            <p>Images need to be added in Sanity CMS</p>
          </div>
        )}
      </div>

      {/* Text Content - Left Side */}
      <div className="col-span-full md:col-span-4 flex flex-col justify-center">
        <h1 className="mb-6">{section.content.heading}</h1>

        {section.content.body && (
          <div className="mb-6">
            <PortableText value={section.content.body} />
          </div>
        )}

        {section.content.cta && (
          <Link
            href={section.content.cta.url}
            className="c-action inline-block w-fit"
          >
            {section.content.cta.text}
          </Link>
        )}
      </div>
    </section>
  );
}
