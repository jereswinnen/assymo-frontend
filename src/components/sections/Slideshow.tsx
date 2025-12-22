import SlideshowComponent from "@/components/general/Slideshow";

interface SlideshowProps {
  section: {
    _type: "slideshow";
    background?: boolean;
    images?: {
      _key: string;
      image: { url: string; alt?: string };
      caption?: string;
    }[];
  };
}

export default function Slideshow({ section }: SlideshowProps) {
  const { background } = section;

  // Transform from backend structure { image: { url, alt }, caption }
  // to component structure { url, alt, caption }
  const images = (section.images || []).map((img) => ({
    url: img.image?.url || "",
    alt: img.image?.alt,
    caption: img.caption,
  }));

  if (background) {
    return (
      <section className="o-grid--bleed col-span-full grid grid-cols-subgrid py-8 md:py-14 bg-stone-200">
        <div className="col-span-full">
          {images.length > 0 ? (
            <SlideshowComponent images={images} variant="fullwidth" />
          ) : (
            <div className="p-4 bg-yellow-100 text-center rounded-lg">
              <h3 className="font-semibold mb-2">Slideshow Section</h3>
              <p>No images added yet</p>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="col-span-full">
      {images.length > 0 ? (
        <SlideshowComponent images={images} variant="fullwidth" />
      ) : (
        <div className="p-4 bg-yellow-100 text-center rounded-lg">
          <h3 className="font-semibold mb-2">Slideshow Section</h3>
          <p>No images added yet</p>
        </div>
      )}
    </section>
  );
}
