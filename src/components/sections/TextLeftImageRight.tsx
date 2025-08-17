import { urlFor } from "@/sanity/imageUrl";
import { PortableText } from "@portabletext/react";
import Link from "next/link";

interface TextLeftImageRightProps {
  section: {
    _type: "textLeftImageRight";
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

export default function TextLeftImageRight({
  section,
}: TextLeftImageRightProps) {
  return (
    <section className="col-span-full grid grid-cols-subgrid gap-y-8 md:gap-y-0">
      {/* Text Content - Left Side */}
      <div className="col-span-full md:col-span-4 flex flex-col justify-center">
        <h2 className="mb-6">{section.content.heading}</h2>

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

      {/* Image - Right Side */}
      <div className="col-span-full md:col-span-4">
        <img
          src={urlFor(section.image).url()}
          alt={section.image.alt}
          className="w-full h-auto object-cover rounded-lg"
        />
      </div>
    </section>
  );
}
