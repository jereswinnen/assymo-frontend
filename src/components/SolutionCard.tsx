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
      className="group bg-white p-3 rounded-xl shadow-md flex flex-col items-center gap-3 overflow-hidden transition-transform duration-200 hover:scale-[1.025]"
    >
      {solution.headerImage && (
        <div className="aspect-w-16 aspect-h-9">
          <img
            src={urlFor(solution.headerImage).url()}
            alt={solution.headerImage.alt || solution.name}
            className="rounded-md w-full h-full object-cover"
          />
        </div>
      )}
      <span className="text-base font-medium px-3 p-1 bg-(--c-accent-dark)/15 rounded-full">
        {solution.name}
      </span>
    </Link>
  );
}
