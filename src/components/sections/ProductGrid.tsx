import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/sanity/imageUrl";

interface Product {
  _id: string;
  name: string;
  slug: { current: string };
  headerImage?: {
    _type: "image";
    asset: { _ref: string; _type: "reference" };
    hotspot?: { x: number; y: number };
    alt?: string;
  };
}

interface ProductGridProps {
  section: {
    _type: "productGrid";
    heading?: string;
    products: Product[];
  };
}

export default function ProductGrid({ section }: ProductGridProps) {
  // Helper function to remove the "XX_" prefix pattern
  const cleanTitle = (title: string) => {
    // Remove pattern: numbers followed by underscore at the start
    return title.replace(/^\d+_/, "");
  };

  if (!section.products || section.products.length === 0) {
    return (
      <section className="col-span-full">
        <div className="p-4 bg-yellow-100 text-center rounded-lg">
          <h3 className="font-semibold mb-2">Product Grid</h3>
          <p>No products found or products need to be added in Sanity CMS</p>
        </div>
      </section>
    );
  }

  return (
    <section className="col-span-full space-y-8">
      {section.heading && (
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold">{section.heading}</h2>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {section.products.map((product) => (
          <Link
            key={product._id}
            href={`/oplossingen/${product.slug.current}`}
            className="group bg-white p-4 rounded-2xl shadow-sm flex flex-col gap-4 overflow-hidden transition-all duration-300 hover:scale-[1.025] hover:shadow-md border border-gray-100"
          >
            {product.headerImage ? (
              <div className="w-full overflow-hidden rounded-xl aspect-[4/3] relative bg-gray-50">
                <Image
                  src={urlFor(product.headerImage).url()}
                  alt={product.headerImage.alt || product.name}
                  fill
                  className="group-hover:scale-105 object-cover transition-all duration-700"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                />
              </div>
            ) : (
              <div className="w-full aspect-[4/3] bg-gray-100 rounded-xl flex items-center justify-center">
                <span className="text-gray-400 text-sm">No Image</span>
              </div>
            )}
            <div className="text-center mt-auto">
              <span className="text-base font-medium px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-full inline-block transition-colors">
                {cleanTitle(product.name)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
