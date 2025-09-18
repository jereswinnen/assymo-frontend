import Image from "next/image";
import { PortableText } from "@portabletext/react";
import Link from "next/link";
import { urlFor } from "@/sanity/imageUrl";

interface PortableTextBlock {
  [key: string]: any;
}

interface Cta {
  text?: string;
  url?: string;
}

interface SanityImageLike {
  _type?: "image";
  asset?: any;
  assetRef?: any;
  alt?: string;
  hotspot?: { x: number; y: number };
}

interface SectionProps {
  section: {
    _type: "textLeftImageGridRight";
    content?: {
      heading?: string;
      body?: PortableTextBlock[];
      cta?: Cta;
    };
    images?: SanityImageLike[];
  };
}

function isRelativeUrl(url: string) {
  try {
    // Treat protocol-relative and absolute as external
    return url.startsWith("/");
  } catch {
    return false;
  }
}

export default function TextLeftImageGridRight({ section }: SectionProps) {
  const images = (section.images || []).slice(0, 4);

  return (
    <section className="col-span-full grid grid-cols-subgrid gap-y-8 md:gap-y-0">
      {/* Text - Left */}
      <div className="col-span-full md:col-span-4 flex flex-col justify-center">
        {section.content?.heading && (
          <h2 className="mb-6">{section.content.heading}</h2>
        )}

        {section.content?.body && (
          <div className="mb-6">
            <PortableText value={section.content.body} />
          </div>
        )}

        {section.content?.cta?.url &&
          section.content?.cta?.text &&
          (isRelativeUrl(section.content.cta.url) ? (
            <Link
              href={section.content.cta.url}
              className="c-action inline-block w-fit"
            >
              {section.content.cta.text}
            </Link>
          ) : (
            <a
              href={section.content.cta.url}
              target="_blank"
              rel="noreferrer"
              className="c-action inline-block w-fit"
            >
              {section.content.cta.text}
            </a>
          ))}
      </div>

      {/* Image Grid - Right */}
      <div className="col-span-full md:col-span-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {images.map((img, idx) => {
            const source: any =
              img._type === "image" || img.asset
                ? img
                : { _type: "image", asset: img.assetRef };
            const alt = img.alt || "";
            return (
              <div
                key={idx}
                className="relative w-full aspect-square overflow-hidden rounded-2xl"
              >
                <Image
                  src={urlFor(source)
                    .width(1000)
                    .height(1000)
                    .fit("crop")
                    .url()}
                  alt={alt}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                  priority={idx === 0}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
