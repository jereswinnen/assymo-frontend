import { Metadata } from "next";
import { getAllSolutions } from "@/lib/content";
import { CONFIGURATOR_PRODUCTS } from "@/config/configurator";
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

  // Get solutions from database to use as product options
  const solutions = await getAllSolutions();

  // Filter solutions to only include configurator-enabled products
  // and map to the format needed by the wizard
  const products = solutions
    .filter((s) => CONFIGURATOR_PRODUCTS.includes(s.slug as any))
    .map((s) => ({
      slug: s.slug,
      name: s.name,
    }));

  // Add any configurator products that aren't in solutions yet
  // (in case solutions don't cover all configurator products)
  const existingSlugs = new Set(products.map((p) => p.slug));
  for (const slug of CONFIGURATOR_PRODUCTS) {
    if (!existingSlugs.has(slug)) {
      // Convert slug to display name (e.g., "tuinhuizen-op-maat" -> "Tuinhuizen op maat")
      const name = slug
        .split("-")
        .map((word, i) => (i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
        .join(" ");
      products.push({ slug, name });
    }
  }

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
