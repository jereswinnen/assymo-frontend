import { cn } from "@/lib/utils";
import { blockComponents, isValidBlockType } from "./blocks";
import { layoutGridClasses, alignClasses } from "./layouts";
import type { FlexibleSectionData, FlexibleBlock } from "./types";

interface FlexibleSectionProps {
  section: FlexibleSectionData;
}

function BlockRenderer({ blocks }: { blocks?: FlexibleBlock[] }) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <>
      {blocks.map((block) => {
        if (!isValidBlockType(block._type)) {
          console.warn(`Unknown block type: ${block._type}`);
          return null;
        }

        const BlockComponent = blockComponents[block._type];
        return <BlockComponent key={block._key} block={block} />;
      })}
    </>
  );
}

export default function FlexibleSection({ section }: FlexibleSectionProps) {
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
        background && "o-grid--bleed bg-zinc-200 py-8 md:py-14",
      )}
    >
      {isSingleColumn ? (
        <div className={gridClasses.main}>
          <BlockRenderer blocks={blockMain} />
        </div>
      ) : (
        <>
          <div className={cn(gridClasses.left, alignClass)}>
            <BlockRenderer blocks={blockLeft} />
          </div>
          <div className={cn(gridClasses.right, alignClass)}>
            <BlockRenderer blocks={blockRight} />
          </div>
        </>
      )}
    </section>
  );
}
