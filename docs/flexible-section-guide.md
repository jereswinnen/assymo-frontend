# Flexible Section System - Developer Guide

A composable section system allowing content editors to build custom layouts by combining blocks.

## Architecture Overview

```
flexibleSection (container)
├── layout: "1-col" | "2-col-equal" | "2-col-left-wide" | "2-col-right-wide"
├── background: "none" | "light" | "dark"
├── verticalPadding: "none" | "sm" | "md" | "lg"
├── verticalAlign: "start" | "center" | "end"
├── columnMain[]: blocks (1-col layout)
├── columnLeft[]: blocks (2-col layouts)
└── columnRight[]: blocks (2-col layouts)
```

## File Structure

### Sanity Studio
```
assymo-studio/schemaTypes/blocks/flexibleSection/
├── index.ts              # flexibleSectionType
├── layouts.ts            # Layout options
└── blocks/
    ├── index.ts          # Block registry
    ├── textBlock.ts
    ├── imageBlock.ts
    ├── mapBlock.ts
    └── formBlock.ts
```

### Frontend
```
assymo-frontend/src/components/sections/FlexibleSection/
├── index.tsx             # Main component
├── types.ts              # TypeScript interfaces
├── layouts.ts            # Grid/styling classes
└── blocks/
    ├── index.ts          # Component registry
    ├── TextBlock.tsx
    ├── ImageBlock.tsx
    ├── MapBlock.tsx
    └── FormBlock.tsx
```

---

## Adding a New Block

### Step 1: Create Sanity Schema

Create `assymo-studio/schemaTypes/blocks/flexibleSection/blocks/yourBlock.ts`:

```typescript
import {defineField, defineType} from 'sanity'

export const flexYourBlockType = defineType({
  name: 'flexYourBlock',           // Must start with 'flex'
  title: 'Your Blok',              // Dutch title for Studio UI
  type: 'object',
  fields: [
    defineField({
      name: 'yourField',
      title: 'Your Field',
      type: 'string',
    }),
    // Add more fields as needed
  ],
  preview: {
    select: {
      title: 'yourField',
    },
    prepare({title}) {
      return {
        title: title || 'Your Blok',
        subtitle: 'Your Block Type',
      }
    },
  },
})
```

### Step 2: Register in Studio

In `assymo-studio/schemaTypes/blocks/flexibleSection/blocks/index.ts`:

```typescript
import {flexYourBlockType} from './yourBlock'

export const flexibleBlockTypes = [
  // ...existing blocks
  flexYourBlockType,
]
```

### Step 3: Create React Component

Create `assymo-frontend/src/components/sections/FlexibleSection/blocks/YourBlock.tsx`:

```typescript
import type { FlexYourBlock } from "../types";

interface YourBlockProps {
  block: FlexYourBlock;
}

export default function YourBlock({ block }: YourBlockProps) {
  return (
    <div>
      {/* Your component implementation */}
    </div>
  );
}
```

### Step 4: Register Frontend Component

In `assymo-frontend/src/components/sections/FlexibleSection/blocks/index.ts`:

```typescript
import YourBlock from "./YourBlock";

export const blockComponents: Record<string, ComponentType<{ block: any }>> = {
  // ...existing blocks
  flexYourBlock: YourBlock,
};
```

### Step 5: Add TypeScript Type

In `assymo-frontend/src/components/sections/FlexibleSection/types.ts`:

```typescript
export interface FlexYourBlock extends BaseBlock {
  _type: "flexYourBlock";
  yourField?: string;
  // Add your fields
}

// Update the union type
export type FlexibleBlock =
  | FlexTextBlock
  | FlexImageBlock
  | FlexMapBlock
  | FlexFormBlock
  | FlexYourBlock;  // Add here
```

### Step 6: Update GROQ (if needed)

If your block has fields not already in `flexibleBlockFields`, add them in `assymo-frontend/src/sanity/fragments.ts`:

```typescript
export const flexibleBlockFields = `
  _key,
  _type,
  // ...existing fields
  yourField,  // Add new fields here
`;
```

---

## Adding a New Layout

### Step 1: Add to Studio Options

In `assymo-studio/schemaTypes/blocks/flexibleSection/layouts.ts`:

```typescript
export const layoutOptions = [
  // ...existing layouts
  {
    title: '3 Kolommen (gelijk)',
    value: '3-col-equal',
  },
]
```

### Step 2: Add Grid Config

In `assymo-frontend/src/components/sections/FlexibleSection/layouts.ts`:

```typescript
export const layoutGridClasses: Record<FlexibleLayout, { left: string; right: string; center?: string; main: string }> = {
  // ...existing layouts
  "3-col-equal": {
    left: "col-span-full md:col-span-3",
    center: "col-span-full md:col-span-3",
    right: "col-span-full md:col-span-3",
    main: "",
  },
};
```

### Step 3: Add Column Field (for 3+ columns)

In `assymo-studio/schemaTypes/blocks/flexibleSection/index.ts`, add a new column field:

```typescript
defineField({
  name: 'columnCenter',
  title: 'Middelste Kolom',
  type: 'array',
  of: flexibleBlockTypeNames,
  hidden: ({parent}) => !parent?.layout?.includes('3-col'),
}),
```

### Step 4: Update Types

In `assymo-frontend/src/components/sections/FlexibleSection/types.ts`:

```typescript
export type FlexibleLayout =
  | "1-col"
  | "2-col-equal"
  | "2-col-left-wide"
  | "2-col-right-wide"
  | "3-col-equal";  // Add new layout

export interface FlexibleSectionData {
  // ...existing fields
  columnCenter?: FlexibleBlock[];  // Add if needed
}
```

### Step 5: Update Component

In `assymo-frontend/src/components/sections/FlexibleSection/index.tsx`, add rendering logic for the new column.

---

## Checklists

### New Block Checklist
- [ ] Schema file in `assymo-studio/.../blocks/`
- [ ] Export added to `blocks/index.ts` (Studio)
- [ ] React component in `assymo-frontend/.../blocks/`
- [ ] Component added to `blockComponents` registry
- [ ] TypeScript interface added to `types.ts`
- [ ] Union type updated in `types.ts`
- [ ] GROQ fields added (if new fields)

### New Layout Checklist
- [ ] Option added to `layoutOptions` (Studio)
- [ ] Grid classes added to `layoutGridClasses` (Frontend)
- [ ] Type added to `FlexibleLayout` union
- [ ] Column field added to schema (if >2 columns)
- [ ] Column field added to `FlexibleSectionData` interface
- [ ] Component updated to render new column
