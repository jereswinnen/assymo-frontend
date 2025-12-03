import type { ComponentType } from "react";
import TextBlock from "./TextBlock";
import ImageBlock from "./ImageBlock";
import MapBlock from "./MapBlock";
import FormBlock from "./FormBlock";

// Block component registry - add new blocks here
export const blockComponents: Record<string, ComponentType<{ block: any }>> = {
  flexTextBlock: TextBlock,
  flexImageBlock: ImageBlock,
  flexMapBlock: MapBlock,
  flexFormBlock: FormBlock,
};

// Type guard helper
export function isValidBlockType(
  type: string,
): type is keyof typeof blockComponents {
  return type in blockComponents;
}
