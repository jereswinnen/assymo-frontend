# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run ESLint
npm run lint

# Type checking (use TypeScript compiler directly)
npx tsc --noEmit
```

## Architecture Overview

This is a Next.js 15.3.2 application using App Router with Sanity CMS as the content backend.

### Key Technologies
- **Framework**: Next.js 15.3.2 with App Router
- **Styling**: Tailwind CSS v4 with custom CSS using grid layouts
- **CMS**: Sanity with next-sanity integration
- **TypeScript**: Strict mode enabled
- **Font**: Instrument Sans from Google Fonts

### Project Structure

- **src/app/**: App Router pages and layouts
  - Dynamic routes for solutions: `oplossingen/[slug]/`
  - Static pages: home, contact, over-ons (about)
  - All pages use `export const dynamic = "force-dynamic"` for fresh content
  
- **src/components/**: Reusable React components
  - Layout components: Header, Footer, NavLinks
  - Content components: SolutionCard, SectionUSPs
  
- **src/sanity/**: Sanity CMS configuration
  - `client.ts`: Sanity client setup (project: naj44gzh, dataset: production)
  - `imageUrl.ts`: Sanity image URL builder
  
- **src/lib/**: Utility functions
  - `getPageMetadata.ts`: Dynamic metadata generation for pages

### Sanity Content Types

The application fetches content from Sanity CMS with these main content types:
- **page**: General pages with title, body (Portable Text), and headerImage
- **solution**: Product/service solutions with name, slug, headerImage, and body

### Styling Approach

- Custom grid system using CSS variables (`--u-grid-columns`, `--u-grid-gap`)
- Responsive grid: 2 columns on mobile, 8 columns on desktop
- Custom spacing tokens: `container-sm` (1.4rem), `container-md` (3rem)
- Color scheme with accent colors: light (#22df90) and dark (#1f3632)
- Typography scale from h1-h4 with custom sizing and spacing

### Path Aliases

- `@/*` maps to `./src/*` for clean imports

### Important Notes

- Images are served from Sanity CDN (cdn.sanity.io)
- All pages fetch fresh data on each request (no static generation)
- PortableText is used for rendering rich text content from Sanity
- The project uses strict TypeScript configuration