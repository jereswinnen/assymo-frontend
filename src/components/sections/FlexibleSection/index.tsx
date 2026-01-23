import { cn } from "@/lib/utils";
import { blockComponents, isValidBlockType } from "./blocks";
import { layoutGridClasses, alignClasses } from "./layouts";
import type { FlexibleSectionData, FlexibleBlock } from "./types";

interface FlexibleSectionProps {
  section: FlexibleSectionData;
  /** Solution name to pass to form blocks (for pre-selecting product) */
  solutionName?: string;
  /** Configurator category slug for pre-selecting product in configurator */
  configuratorCategorySlug?: string | null;
}

function BlockRenderer({ blocks, solutionName, configuratorCategorySlug }: { blocks?: FlexibleBlock[]; solutionName?: string; configuratorCategorySlug?: string | null }) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <>
      {blocks.map((block) => {
        if (!isValidBlockType(block._type)) {
          console.warn(`Unknown block type: ${block._type}`);
          return null;
        }

        const BlockComponent = blockComponents[block._type];
        return <BlockComponent key={block._key} block={block} solutionName={solutionName} configuratorCategorySlug={configuratorCategorySlug} />;
      })}
    </>
  );
}

export default function FlexibleSection({ section, solutionName, configuratorCategorySlug }: FlexibleSectionProps) {
  const {
    layout,
    background = false,
    verticalAlign = "start",
    blockMain,
    blockLeft,
    blockRight,
  } = section;

  const gridClasses = layoutGridClasses[layout];
  const alignClass = alignClasses[verticalAlign];

  const isSingleColumn = layout === "1-col";

  return (
    <section
      className={cn(
        "col-span-full grid grid-cols-subgrid gap-y-8",
        background && "o-grid--bleed bg-stone-200 py-8 md:py-14",
      )}
    >
      {isSingleColumn ? (
        <div className={gridClasses.main}>
          <BlockRenderer blocks={blockMain} solutionName={solutionName} configuratorCategorySlug={configuratorCategorySlug} />
        </div>
      ) : (
        <>
          <div className={cn(gridClasses.left, alignClass)}>
            <BlockRenderer blocks={blockLeft} solutionName={solutionName} configuratorCategorySlug={configuratorCategorySlug} />
          </div>
          <div className={cn(gridClasses.right, alignClass)}>
            <BlockRenderer blocks={blockRight} solutionName={solutionName} configuratorCategorySlug={configuratorCategorySlug} />
          </div>
        </>
      )}
    </section>
  );
}
