import { getCategoriesForSite } from "@/lib/configurator/categories";
import { Wizard } from "@/components/configurator/Wizard";
import { buildMetadata } from "@/lib/getPageMetadata";

export const metadata = buildMetadata({
  title: "Configurator",
  description:
    "Stel uw ideale tuinhuis, poolhouse of carport samen en ontvang direct een prijsindicatie.",
  path: "/configurator",
});

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
    <section className="mx-auto max-w-4xl grid gap-y-12! md:gap-y-20!">
      {/* Header Section */}
      <header className="col-span-full flex flex-col gap-2 md:w-[900px]">
        <h1 className="mb-0!">Configurator</h1>
        <p className="font-[420] text-lg md:text-xl text-stone-600">
          Stel uw ideale project samen en ontvang een vrijblijvende
          prijsindicatie. Vul de onderstaande vragen in en wij nemen contact met
          u op.
        </p>
      </header>

      {/* Wizard Section */}
      <div className="col-span-full">
        <Wizard products={products} initialProduct={validInitialProduct} />
      </div>
    </section>
  );
}
