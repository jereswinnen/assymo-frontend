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
    <main className="container mx-auto min-h-screen max-w-6xl p-8">
      <h1 className="text-4xl font-bold mb-12">Onze Producten</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((product: any) => (
          <Link
            href={`/producten/${product.slug.current}`}
            key={product._id}
            className="group"
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
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                  {product.name}
                </h2>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
