import SlideshowComponent from "@/components/general/Slideshow";

interface SlideshowImage {
  url: string;
  alt?: string;
  caption?: string;
}

interface SlideshowProps {
  section: {
    _type: "slideshow";
    background?: boolean;
    images: SlideshowImage[];
  };
}

export default function Slideshow({ section }: SlideshowProps) {
  const { background } = section;

  if (background) {
    return (
      <section className="o-grid--bleed col-span-full grid grid-cols-subgrid py-8 md:py-14 bg-stone-200">
        <div className="col-span-full">
          {section.images && section.images.length > 0 ? (
            <SlideshowComponent images={section.images} variant="fullwidth" />
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
      {section.images && section.images.length > 0 ? (
        <SlideshowComponent images={section.images} variant="fullwidth" />
      ) : (
        <div className="p-4 bg-yellow-100 text-center rounded-lg">
          <h3 className="font-semibold mb-2">Slideshow Section</h3>
          <p>No images added yet</p>
        </div>
      )}
    </section>
  );
}
