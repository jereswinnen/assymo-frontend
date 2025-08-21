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

interface SlideshowProps {
  section: {
    _type: "slideshow";
    images: SlideshowImage[];
  };
}

export default function Slideshow({ section }: SlideshowProps) {
  return (
    <section className="col-span-full">
      {section.images && section.images.length > 0 ? (
        <SlideshowComponent images={section.images} />
      ) : (
        <div className="p-4 bg-yellow-100 text-center rounded-lg">
          <h3 className="font-semibold mb-2">Slideshow Section</h3>
          <p>Images need to be added in Sanity CMS</p>
          <p className="text-sm mt-1">Section type: {section._type}</p>
        </div>
      )}
    </section>
  );
}