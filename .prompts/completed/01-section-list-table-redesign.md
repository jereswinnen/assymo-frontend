# Section List Table Redesign

<objective>
Refactor the SectionList component from accordion-style to table-style UI, matching the pattern used in the solutions list page. Clicking a row opens a dialog/sheet to edit the section.
</objective>

<context>
<current_implementation>
- `src/components/admin/SectionList.tsx` - Accordion-style with expandable cards
- Each section is a Card with drag handle, expand/collapse chevron, and inline SectionForm
- Uses @dnd-kit for drag-and-drop reordering
- Used by `src/app/admin/content/solutions/[id]/page.tsx` and pages editor
</current_implementation>

<reference_pattern>
- `src/app/admin/content/solutions/page.tsx` - Table with reordering (lines 90-201)
- Uses SortableSolutionRow component with drag handle in first column
- Table structure: drag handle | image | name | url | date | actions
- DndContext wraps Table with SortableContext using verticalListSortingStrategy
- Rows are clickable to navigate to detail page
</reference_pattern>

<section_types>
From `src/types/sections.ts` - section types include:
- textLeft, textRight, textCentered (text layouts)
- slideshow, slideshowCard, slideshowText (carousels)
- productGrid, contactForm, map, usps, image
Each has a `_type` and `_key` identifier
</section_types>
</context>

<requirements>
<functional>
- Replace accordion Cards with shadcn Table component
- Each row: drag handle | section type label | actions (edit, delete)
- Clicking row opens a Dialog or Sheet containing the SectionForm
- Preserve drag-and-drop reordering with @dnd-kit (same pattern as solutions page)
- Keep delete confirmation AlertDialog
- Maintain empty state with AddSectionButton
</functional>

<ui_details>
- Table columns: grip icon (w-10) | Section type name | action buttons (w-10)
- Row hover state matching solutions table
- Edit button opens Dialog/Sheet with section form
- Delete button triggers confirmation dialog
- Compact, scannable list vs current expanded accordion view
</ui_details>

<constraints>
- Keep same props interface: `sections`, `onChange`, `showAddButton`
- Reuse existing SectionForm component inside Dialog/Sheet
- No changes to section data structure
- Must work for both pages and solutions editors
</constraints>
</requirements>

<implementation_hints>
- Create SortableSectionRow similar to SortableSolutionRow
- Use Dialog (for smaller forms) or Sheet (for larger forms) from shadcn
- State for editingSection: Section | null to control dialog
- getSectionLabel() already exists in types/sections.ts for display names
</implementation_hints>

<files_to_modify>
- `src/components/admin/SectionList.tsx` - Main refactor
</files_to_modify>

<verification>
- Navigate to a solution or page editor
- Verify sections display as table rows
- Test drag-and-drop reordering
- Test row click opens edit dialog with correct form
- Test delete confirmation works
- Verify changes are tracked (hasChanges in parent)
</verification>
