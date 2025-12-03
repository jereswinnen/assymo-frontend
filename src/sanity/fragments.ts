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

export const projectReferenceFields = `
  _id,
  name,
  subtitle,
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
  background,
  showImage,
  showButtons,
  buttons[]{
    label,
    url,
    icon,
    variant
  }
`;

// USP section fields
export const uspFields = `
  icon,
  title,
  text,
  link
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

// Flexible section block fields
export const flexibleBlockFields = `
  _key,
  _type,
  heading,
  headingLevel,
  content,
  showButton,
  button{
    label,
    url,
    icon,
    variant
  },
  image{
    ${imageFields}
  },
  title,
  subtitle
`;

export const flexibleSectionFields = `
  internalName,
  layout,
  background,
  verticalAlign,
  blockMain[]{${flexibleBlockFields}},
  blockLeft[]{${flexibleBlockFields}},
  blockRight[]{${flexibleBlockFields}}
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
    projects[]->{
      ${projectReferenceFields}
    },
    content{
      ${contentFields}
    },
    items[]{
      ${splitItemFields}
    },
    usps[]{
      ${uspFields}
    },
    ${pageHeaderFields},
    ${flexibleSectionFields}
  }
`;
