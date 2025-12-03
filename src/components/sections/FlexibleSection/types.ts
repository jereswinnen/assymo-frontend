import type { SanityImage } from "@/types/sanity";

// Base block interface
interface BaseBlock {
  _key: string;
  _type: string;
}

// Text Block
export interface FlexTextBlock extends BaseBlock {
  _type: "flexTextBlock";
  heading?: string;
  headingLevel?: "h2" | "h3" | "h4";
  content?: any[];
  showButton?: boolean;
  button?: {
    label: string;
    url: string;
    icon?: string;
    variant?: "primary" | "secondary";
  };
}

// Image Block
export interface FlexImageBlock extends BaseBlock {
  _type: "flexImageBlock";
  image: SanityImage;
}

// Map Block (no config, just renders the embed)
export interface FlexMapBlock extends BaseBlock {
  _type: "flexMapBlock";
}

// Form Block
export interface FlexFormBlock extends BaseBlock {
  _type: "flexFormBlock";
  title?: string;
  subtitle?: string;
}

// Union type for all blocks
export type FlexibleBlock =
  | FlexTextBlock
  | FlexImageBlock
  | FlexMapBlock
  | FlexFormBlock;

// Layout types
export type FlexibleLayout =
  | "1-col"
  | "2-col-equal"
  | "2-col-left-wide"
  | "2-col-right-wide";
export type VerticalAlign = "start" | "center" | "end";

// Main section interface
export interface FlexibleSectionData {
  _type: "flexibleSection";
  _key?: string;
  internalName?: string;
  layout: FlexibleLayout;
  background?: boolean;
  verticalAlign?: VerticalAlign;
  blockMain?: FlexibleBlock[];
  blockLeft?: FlexibleBlock[];
  blockRight?: FlexibleBlock[];
}
