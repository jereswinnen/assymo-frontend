export const dynamic = "force-dynamic";

import { client } from "@/sanity/client";
import SolutionCard from "@/components/SolutionCard";

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
    <section className="px-container-sm md:px-container-md col-span-full grid grid-cols-subgrid">
      <header className="col-span-full">
        <h1>
          Onze <b>oplossingen</b>
        </h1>
      </header>
      <div className="col-span-full grid grid-cols-subgrid">
        <section className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-10">
          {solutions.map((solution: any) => (
            <SolutionCard key={solution._id} solution={solution} />
          ))}
        </section>
      </div>
    </section>
  );
}
