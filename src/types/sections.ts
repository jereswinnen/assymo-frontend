// Section type definitions for the CMS

export type SectionType =
  | "pageHeader"
  | "slideshow"
  | "solutionsScroller"
  | "splitSection"
  | "uspSection"
  | "flexibleSection";

export interface BaseSection {
  _key: string;
  _type: SectionType;
}

export interface PageHeaderSection extends BaseSection {
  _type: "pageHeader";
  title?: string;
  subtitle?: string; // HTML from Tiptap
  background?: boolean;
  showImage?: boolean;
  showButtons?: boolean;
  buttons?: {
    _key: string;
    label: string;
    action?: "link" | "openChatbot" | "openConfigurator";
    url?: string;
    icon?: string;
    variant?: "primary" | "secondary";
  }[];
}

export interface SlideshowSection extends BaseSection {
  _type: "slideshow";
  background?: boolean;
  images?: {
    _key: string;
    image: { url: string; alt?: string };
    caption?: string;
  }[];
}

export interface SolutionsScrollerSection extends BaseSection {
  _type: "solutionsScroller";
  heading?: string;
  subtitle?: string;
}

export interface SplitSectionItem {
  _key: string;
  image?: { url: string; alt?: string };
  title?: string;
  subtitle?: string;
  actionType?: "link" | "openChatbot" | "openConfigurator";
  href?: string;
  action?: {
    label?: string;
    icon?: string;
    variant?: "primary" | "secondary";
  };
}

export interface SplitSectionSection extends BaseSection {
  _type: "splitSection";
  items?: [SplitSectionItem, SplitSectionItem, SplitSectionItem?];
}

export interface UspItem {
  _key: string;
  icon?: string;
  title?: string;
  text?: string;
  link?: {
    label?: string;
    url?: string;
  };
}

export interface UspSectionSection extends BaseSection {
  _type: "uspSection";
  heading?: string;
  usps?: UspItem[];
}

export type FlexibleSectionLayout =
  | "1-col"
  | "2-col-equal"
  | "2-col-left-wide"
  | "2-col-right-wide";

export type FlexibleBlockType =
  | "flexTextBlock"
  | "flexImageBlock"
  | "flexMapBlock"
  | "flexFormBlock";

export interface FlexTextBlock {
  _key: string;
  _type: "flexTextBlock";
  heading?: string;
  headingLevel?: "h2" | "h3" | "h4";
  text?: string; // HTML from Tiptap
  button?: {
    label?: string;
    action?: "link" | "openChatbot" | "openConfigurator";
    url?: string;
    icon?: string;
    variant?: "primary" | "secondary";
  };
}

export interface FlexImageBlock {
  _key: string;
  _type: "flexImageBlock";
  image?: { url: string; alt?: string };
}

export interface FlexMapBlock {
  _key: string;
  _type: "flexMapBlock";
}

export interface FlexFormBlock {
  _key: string;
  _type: "flexFormBlock";
  title?: string;
  subtitle?: string;
}

export type FlexibleBlock =
  | FlexTextBlock
  | FlexImageBlock
  | FlexMapBlock
  | FlexFormBlock;

export interface FlexibleSectionSection extends BaseSection {
  _type: "flexibleSection";
  layout?: FlexibleSectionLayout;
  background?: boolean;
  verticalAlign?: "top" | "center" | "bottom";
  blockMain?: FlexibleBlock[];
  blockLeft?: FlexibleBlock[];
  blockRight?: FlexibleBlock[];
}

export type Section =
  | PageHeaderSection
  | SlideshowSection
  | SolutionsScrollerSection
  | SplitSectionSection
  | UspSectionSection
  | FlexibleSectionSection;

// Section metadata for the UI
export const SECTION_TYPES: {
  type: SectionType;
  label: string;
  description: string;
}[] = [
  {
    type: "pageHeader",
    label: "Page Header",
    description: "Titel, subtitel en optionele knoppen",
  },
  {
    type: "slideshow",
    label: "Slideshow",
    description: "Afbeelding carrousel",
  },
  {
    type: "solutionsScroller",
    label: "Realisaties Scroller",
    description: "Horizontale lijst van realisaties",
  },
  {
    type: "splitSection",
    label: "Split Section",
    description: "Twee of drie items naast elkaar",
  },
  {
    type: "uspSection",
    label: "USPs",
    description: "Unique selling points met iconen",
  },
  {
    type: "flexibleSection",
    label: "Flexibele Sectie",
    description: "Aanpasbare layout met tekst, afbeeldingen, formulier of kaart",
  },
];

// Create a new section with defaults
export function createSection(type: SectionType): Section {
  const _key = crypto.randomUUID();

  switch (type) {
    case "pageHeader":
      return {
        _key,
        _type: "pageHeader",
        title: "",
        subtitle: "",
        background: false,
        showImage: true,
        showButtons: false,
        buttons: [],
      };
    case "slideshow":
      return {
        _key,
        _type: "slideshow",
        background: false,
        images: [],
      };
    case "solutionsScroller":
      return {
        _key,
        _type: "solutionsScroller",
        heading: "",
        subtitle: "",
      };
    case "splitSection":
      return {
        _key,
        _type: "splitSection",
        items: [
          { _key: crypto.randomUUID() },
          { _key: crypto.randomUUID() },
        ],
      };
    case "uspSection":
      return {
        _key,
        _type: "uspSection",
        heading: "",
        usps: [],
      };
    case "flexibleSection":
      return {
        _key,
        _type: "flexibleSection",
        layout: "1-col",
        background: false,
        verticalAlign: "top",
        blockMain: [],
        blockLeft: [],
        blockRight: [],
      };
  }
}

// Get display label for a section
export function getSectionLabel(type: SectionType): string {
  return SECTION_TYPES.find((s) => s.type === type)?.label || type;
}
