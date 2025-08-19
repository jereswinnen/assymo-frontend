import { urlFor } from "@/sanity/imageUrl";
import { PortableText } from "@portabletext/react";
import Link from "next/link";

interface TextRightImageLeftProps {
  section: {
    _type: "textRightImageLeft";
    image: {
      _type: "image";
      asset: { _ref: string; _type: "reference" };
      hotspot?: { x: number; y: number };
      alt: string;
    };
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

export default function TextRightImageLeft({
  section,
}: TextRightImageLeftProps) {
  return (
    <section className="col-span-full grid grid-cols-subgrid gap-y-8 md:gap-y-0">
      {/* Image - Left Side */}
      <div className="col-span-full md:col-span-4 order-2 md:order-1">
        <img
          src={urlFor(section.image).url()}
          alt={section.image.alt}
          className="w-full h-auto object-cover rounded-2xl"
        />
      </div>

      {/* Text Content - Right Side */}
      <div className="col-span-full md:col-span-4 flex flex-col justify-center order-1 md:order-2">
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
