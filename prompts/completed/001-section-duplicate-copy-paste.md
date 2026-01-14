<objective>
Add duplicate and copy/paste functionality to the SectionList admin component.

Two features needed:
1. **Per-section actions dropdown**: Replace the trash icon with an ellipsis (⋮) button that opens a dropdown with: Dupliceren, Kopiëren, Verwijderen
2. **Paste section capability**: Add an ellipsis dropdown button next to the "Sectie toevoegen" button with a "Plakken" option to paste a copied section

This enables content editors to quickly duplicate sections within a page and copy sections between different pages.
</objective>

<context>
Read project conventions from CLAUDE.md first.

Key files to examine:
- `@src/components/admin/SectionList.tsx` - Main component to modify
- `@src/components/admin/AddSectionButton.tsx` - Reference for button placement/styling
- `@src/config/strings.ts` - Dutch UI strings (add new keys here)
- `@src/types/sections.ts` - Section type definitions and `createSection` factory

Tech stack context:
- Uses `@radix-ui/react-dropdown-menu` (already installed)
- Uses `lucide-react` for icons (MoreVerticalIcon for ellipsis)
- Dutch strings via `t()` helper from `@/config/strings`
- Sections have `_key` (unique identifier) and `_type` properties
</context>

<requirements>
<feature_1>
**Per-section dropdown menu (replace trash icon)**

1. Replace the `Trash2Icon` button in `SortableSectionRow` with a `MoreVerticalIcon` (ellipsis) button
2. Wrap in a `DropdownMenu` with three items:
   - **Dupliceren**: Creates a copy of the section with a new `_key`, inserts immediately after the current section
   - **Kopiëren**: Stores the section data for cross-page pasting
   - **Verwijderen**: Opens the existing delete confirmation dialog

3. Dropdown menu styling should match the existing ghost button style
4. Ensure click events don't propagate to the row's onClick handler
</feature_1>

<feature_2>
**Paste section button (next to AddSectionButton)**

1. Add an ellipsis dropdown button adjacent to the existing "Sectie toevoegen" button
2. Dropdown contains single item: **Plakken** (disabled when clipboard is empty)
3. When clicked, pastes the copied section at the bottom of the sections list with a new `_key`
4. The paste button should visually pair with AddSectionButton (same row, appropriate spacing)
</feature_2>

<clipboard_implementation>
For cross-page copy/paste, use `localStorage`:
- Key: `assymo_copied_section`
- Value: JSON-stringified section data
- On copy: Store the full section object
- On paste: Parse, generate new `_key`, add to sections array
- Check clipboard state with a `useEffect` + storage event listener to enable/disable paste option

Generate new `_key` using the same pattern as existing code (check how `createSection` in `src/types/sections.ts` generates keys, likely `crypto.randomUUID()` or similar).
</clipboard_implementation>
</requirements>

<strings_to_add>
Add these keys to `src/config/strings.ts` under the admin section:
```typescript
"admin.buttons.duplicate": "Dupliceren",
"admin.buttons.copy": "Kopiëren",
"admin.buttons.paste": "Plakken",
```
</strings_to_add>

<implementation_notes>
- The duplicate handler should insert the new section right after the original (not at the end)
- For paste, always append to the end of the sections array
- The paste dropdown button only needs to appear when sections exist AND the AddSectionButton is shown
- When clipboard is empty, show "Plakken" as disabled (grayed out, not clickable)
- Consider adding a toast notification on copy success using the existing `sonner` toast system
</implementation_notes>

<output>
Modify these files:
- `./src/components/admin/SectionList.tsx` - Add dropdown menus and clipboard logic
- `./src/config/strings.ts` - Add new Dutch string keys
</output>

<verification>
Before completing, verify:
1. Run `pnpm lint` to check for linting errors
2. Run `npx tsc --noEmit` to verify TypeScript compiles
3. Manually verify the dropdown menus render correctly (if dev server is accessible)
</verification>

<success_criteria>
- Trash icon replaced with ellipsis dropdown containing Dupliceren, Kopiëren, Verwijderen
- Duplicating a section inserts the copy immediately after the original
- Copying a section stores it in localStorage
- Paste button appears next to "Sectie toevoegen" with Plakken option
- Paste is disabled when no section is in clipboard
- All new UI text uses `t()` helper with strings from `strings.ts`
- TypeScript compiles without errors
- ESLint passes
</success_criteria>
