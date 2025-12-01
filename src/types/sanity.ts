export interface SanityImage {
  asset: { _ref: string };
  hotspot?: { x: number; y: number };
  alt?: string;
}

export interface SanityImageWithCaption extends SanityImage {
  caption?: string;
}
