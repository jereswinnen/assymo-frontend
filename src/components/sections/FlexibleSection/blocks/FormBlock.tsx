import ContactForm from "@/components/forms/ContactForm";
import { getAllSolutions } from "@/lib/content";
import type { FlexFormBlock } from "../types";

interface FormBlockProps {
  block: FlexFormBlock;
  /** Solution name to pre-select in the form (when on a solution page) */
  solutionName?: string;
}

export default async function FormBlock({ block, solutionName }: FormBlockProps) {
  const { title, subtitle } = block;

  // Fetch solutions for the product dropdown
  const solutions = await getAllSolutions();
  const products = solutions.map((s) => ({ id: s.id, name: s.name }));

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {(title || subtitle) && (
        <div className="flex flex-col gap-2">
          {title && <h2 className="mb-0!">{title}</h2>}
          {subtitle && (
            <div
              className="font-[420] text-stone-600 text-base md:text-lg"
              dangerouslySetInnerHTML={{ __html: subtitle }}
            />
          )}
        </div>
      )}
      <ContactForm products={products} defaultProduct={solutionName} />
    </div>
  );
}
