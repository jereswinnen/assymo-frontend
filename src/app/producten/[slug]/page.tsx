export const dynamic = "force-dynamic";

import { getPageMetadata } from "@/lib/getPageMetadata";
import { client } from "@/sanity/client";
import { urlFor } from "@/sanity/imageUrl";
import { PortableText } from "@portabletext/react";
import { notFound } from "next/navigation";

const PRODUCT_QUERY = `*[
  _type == "product" && slug.current == $slug
][0]{
  _id,
  name,
  slug,
  headerImage,
  body
}`;

export async function generateMetadata({ params }: any) {
  const product = await client.fetch(PRODUCT_QUERY, { slug: params.slug });

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: product.name || "Product",
    description: `View details about ${product.name || "our product"}`,
  };
}

export default async function ProductPage({ params }: any) {
  const product = await client.fetch(PRODUCT_QUERY, { slug: params.slug });

  if (!product) {
    notFound();
  }

  return (
    <main className="container mx-auto min-h-screen max-w-3xl p-8">
      {product.headerImage && (
        <img
          src={urlFor(product.headerImage).url()}
          alt={product.headerImage.alt || product.name || "Product image"}
          className="w-full h-auto mb-8 rounded-lg"
        />
      )}
      <h1 className="text-4xl font-bold mb-8">
        {product.name || "Untitled Product"}
      </h1>
      {product.body && (
        <div className="prose max-w-none">
          <PortableText value={product.body} />
        </div>
      )}
    </main>
  );
}
