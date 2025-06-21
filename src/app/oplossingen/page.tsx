export const dynamic = "force-dynamic";

import { client } from "@/sanity/client";
import { urlFor } from "@/sanity/imageUrl";
import Link from "next/link";

const SOLUTIONS_QUERY = `*[
  _type == "solution"
] | order(name asc) {
  _id,
  name,
  slug,
  headerImage
}`;

export const metadata = {
  title: "Oplossingen",
  description: "Bekijk onze oplossingen",
};

export default async function SolutionsPage() {
  const solutions = await client.fetch(SOLUTIONS_QUERY);

  return (
    <section className="col-span-full grid grid-cols-subgrid">
      <header className="col-span-full">
        <h1>Onze Oplossingen</h1>
      </header>
      <div className="col-span-full grid grid-cols-subgrid">
        {solutions.map((solution: any) => (
          <Link
            href={`/oplossingen/${solution.slug.current}`}
            key={solution._id}
            className="group col-span-2"
          >
            <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-200 group-hover:scale-105">
              {solution.headerImage && (
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={urlFor(solution.headerImage).url()}
                    alt={solution.headerImage.alt || solution.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                  {solution.name}
                </h2>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
