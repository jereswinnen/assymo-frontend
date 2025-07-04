import Link from "next/link";
import { urlFor } from "@/sanity/imageUrl";

interface SolutionCardProps {
  solution: {
    _id: string;
    name: string;
    slug: { current: string };
    headerImage?: any;
  };
}

export default function SolutionCard({ solution }: SolutionCardProps) {
  return (
    <Link
      href={`/oplossingen/${solution.slug.current}`}
      key={solution._id}
      className="group bg-white p-3 rounded-2xl shadow-sm flex flex-col items-center gap-3 overflow-hidden transition-all duration-300 hover:scale-[1.025] hover:shadow-md"
    >
      {solution.headerImage && (
        <div className="w-full overflow-hidden rounded-lg">
          <img
            src={urlFor(solution.headerImage).url()}
            alt={solution.headerImage.alt || solution.name}
            className="group-hover:scale-105 rounded-lg object-cover max-h-[280px] w-full transition-all duration-700"
          />
        </div>
      )}
      <span className="text-base font-medium px-3 p-1 bg-(--c-accent-dark)/15 rounded-full">
        {solution.name}
      </span>
    </Link>
  );
}
