import { Metadata } from "next";
import { getCategoriesForSite } from "@/lib/configurator/categories";
import { Wizard } from "@/components/configurator/Wizard";

export const metadata: Metadata = {
  title: "Configurator | Assymo",
  description:
    "Stel uw ideale tuinhuis, poolhouse of carport samen en ontvang direct een prijsindicatie.",
};

interface ConfiguratorPageProps {
  searchParams: Promise<{ product?: string }>;
}

export default async function ConfiguratorPage({
  searchParams,
}: ConfiguratorPageProps) {
  // Get search params
  const { product: initialProduct } = await searchParams;

  // Get configurator categories from database
  const categories = await getCategoriesForSite("assymo");

  // Map categories to the format needed by the wizard
  const products = categories.map((cat) => ({
    slug: cat.slug,
    name: cat.name,
  }));

  // Validate initial product if provided
  const validInitialProduct =
    initialProduct && products.some((p) => p.slug === initialProduct)
      ? initialProduct
      : null;

  return (
    <section className="col-span-full grid grid-cols-subgrid gap-y-14">
      {/* Header Section */}
      <header className="col-span-full md:col-span-6 md:col-start-2 lg:col-span-8 lg:col-start-3 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
          Configurator
        </h1>
        <p className="text-lg text-stone-600">
          Stel uw ideale project samen en ontvang een vrijblijvende
          prijsindicatie. Vul de onderstaande vragen in en wij nemen contact met
          u op.
        </p>
      </header>

      {/* Wizard Section */}
      <div className="col-span-full md:col-span-6 md:col-start-2 lg:col-span-8 lg:col-start-3 pb-16">
        <Wizard products={products} initialProduct={validInitialProduct} />
      </div>
    </section>
  );
}
