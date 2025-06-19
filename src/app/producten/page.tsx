export const dynamic = "force-dynamic";

import { client } from "@/sanity/client";
import { urlFor } from "@/sanity/imageUrl";
import Link from "next/link";

const PRODUCTS_QUERY = `*[
  _type == "product"
] | order(name asc) {
  _id,
  name,
  slug,
  headerImage
}`;

export const metadata = {
  title: "Producten",
  description: "Bekijk ons aanbod",
};

export default async function ProductsPage() {
  const products = await client.fetch(PRODUCTS_QUERY);

  return (
    <section className="col-span-full grid grid-cols-subgrid">
      <header className="col-span-full">
        <h1>Onze Producten</h1>
      </header>
      <div className="col-span-full grid grid-cols-subgrid">
        {products.map((product: any) => (
          <Link
            href={`/producten/${product.slug.current}`}
            key={product._id}
            className="group col-span-2"
          >
            <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-200 group-hover:scale-105">
              {product.headerImage && (
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={urlFor(product.headerImage).url()}
                    alt={product.headerImage.alt || product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                  {product.name}
                </h2>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
