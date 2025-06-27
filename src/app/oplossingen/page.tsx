export const dynamic = "force-dynamic";

import { client } from "@/sanity/client";
import { urlFor } from "@/sanity/imageUrl";
import Link from "next/link";
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
    <section className="col-span-full grid grid-cols-subgrid">
      <header className="col-span-full">
        <h1>Onze Oplossingen</h1>
      </header>
      <div className="col-span-full grid grid-cols-subgrid">
        {solutions.map((solution: any) => (
          <SolutionCard key={solution._id} solution={solution} />
        ))}
      </div>
    </section>
  );
}
