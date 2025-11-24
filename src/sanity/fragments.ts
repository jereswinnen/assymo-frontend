// GROQ fragments for section field queries
// These can be imported and used in page queries for consistency

export const imageFields = `
  asset,
  hotspot,
  alt
`;

export const imageWithCaptionFields = `
  asset,
  hotspot,
  alt,
  caption
`;

export const ctaFields = `
  text,
  url
`;

export const productReferenceFields = `
  _id,
  name,
  slug,
  headerImage{
    ${imageFields}
  }
`;

export const contentFields = `
  heading,
  body,
  cta{
    ${ctaFields}
  }
`;

export const pageHeaderFields = `
  title,
  subtitle,
  showButtons,
  buttons[]{
    label,
    url,
    icon,
    variant
  }
`;

// Add a new fragment for split section items
export const splitItemFields = `
  image{
    ${imageFields}
  },
  title,
  subtitle,
  href,
  action{
    label,
    icon,
    variant
  }
`;

// Update sectionsFragment to include items for splitSection
export const sectionsFragment = `
  sections[]{
    _type,
    _key,
    heading,
    image{
      ${imageFields}
    },
    images[]{
      ${imageWithCaptionFields}
    },
    products[]->{
      ${productReferenceFields}
    },
    content{
      ${contentFields}
    },
    items[]{
      ${splitItemFields}
    },
    ${pageHeaderFields}
  }
`;
