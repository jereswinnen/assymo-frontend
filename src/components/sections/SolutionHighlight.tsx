import Image from "next/image";
import Link from "next/link";
import { sql } from "@/lib/db";
import { Action } from "@/components/shared/Action";
import { RichText } from "@/components/RichText";
import { EyeIcon } from "lucide-react";

interface SolutionHighlightProps {
  section: {
    solutionId?: string;
    subtitle?: string;
  };
}

interface SolutionData {
  id: string;
  name: string;
  slug: string;
  header_image: { url: string; alt?: string } | null;
}

async function getSolutionById(id: string): Promise<SolutionData | null> {
  try {
    const rows = await sql`
      SELECT id, name, slug, header_image
      FROM solutions
      WHERE id = ${id}
    `;
    return rows[0] as SolutionData | null;
  } catch {
    return null;
  }
}

export default async function SolutionHighlight({
  section,
}: SolutionHighlightProps) {
  if (!section.solutionId) {
    return null;
  }

  const solution = await getSolutionById(section.solutionId);

  if (!solution) {
    return null;
  }

  const href = `/realisaties/${solution.slug}`;

  return (
    <section className="col-span-full lg:col-start-2 lg:col-span-7 flex flex-col md:flex-row gap-8 md:gap-2.5">
      <Link
        href={href}
        className="group relative h-[220px] md:h-[400px] md:basis-1/2 overflow-hidden"
      >
        {solution.header_image?.url && (
          <Image
            src={solution.header_image.url}
            alt={solution.header_image.alt || solution.name}
            fill
            className="object-cover transition-transform duration-500 ease-circ group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        )}
      </Link>
      <div className="md:basis-1/2 flex flex-col justify-center gap-6 md:gap-8 md:px-8">
        <div className="flex flex-col gap-3">
          <h4>Uitgelichte realisatie</h4>
          <div className="flex flex-col gap-1">
            <h2 className="mb-0! text-2xl md:text-3xl font-medium">
              {solution.name}
            </h2>
            {section.subtitle && (
              <div className="text-stone-600">
                <RichText html={section.subtitle} />
              </div>
            )}
          </div>
        </div>
        <Action
          href={href}
          label="Bekijk realisatie"
          variant="primary"
          icon={<EyeIcon />}
        />
      </div>
    </section>
  );
}
