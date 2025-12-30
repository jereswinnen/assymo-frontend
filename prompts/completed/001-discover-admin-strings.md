<objective>
Discover and catalog ALL hardcoded Dutch content strings in the admin interface.

This is Phase 1 of a string consolidation effort. Your job is to find EVERY hardcoded string that appears in the admin UI - buttons, labels, headings, messages, placeholders, toasts, and any other user-facing text.
</objective>

<context>
This is a Next.js admin CMS with Dutch language content strings scattered throughout:
- Admin pages in `src/app/admin/**/*.tsx`
- Admin components in `src/components/admin/**/*.tsx`
- Shared UI components used by admin in `src/components/ui/**/*.tsx`

Known inconsistencies to watch for:
- "Opslaan" vs "Bewaren" (both mean Save - we will standardize to "Bewaren")
- "Verstuur" vs "Versturen" (both mean Send)
- Various loading states: "Laden...", "Bezig...", etc.
</context>

<requirements>
1. Search ALL files in `src/app/admin/` and `src/components/admin/` for hardcoded strings
2. Identify strings by looking for:
   - JSX text content between tags: `<Button>Text here</Button>`
   - String literals in JSX attributes: `placeholder="..."`
   - Toast messages: `toast.success("...")`, `toast.error("...")`
   - AlertDialog content, Sheet titles, labels, descriptions
   - Table headers, empty states, tooltips
   - Loading states and conditional text

3. For each string found, record:
   - The exact string value
   - File path and line number
   - Context (button, label, toast, etc.)
   - Suggested key name using dot notation pattern

4. Group strings by category:
   - `admin.buttons.*` - Action buttons (save, cancel, delete, add, edit)
   - `admin.labels.*` - Form labels, field labels
   - `admin.headings.*` - Page titles, section headings
   - `admin.messages.*` - Success/error messages, confirmations
   - `admin.placeholders.*` - Input placeholders
   - `admin.empty.*` - Empty state messages
   - `admin.loading.*` - Loading states
   - `admin.validation.*` - Validation error messages
</requirements>

<output>
Create a comprehensive inventory file at `./string-inventory.md` with:

1. **Summary Statistics**
   - Total strings found
   - Strings per category
   - Files with most strings
   - Identified inconsistencies

2. **Full String Inventory** (grouped by category)
   For each string:
   ```
   | String | Suggested Key | File | Line | Context |
   ```

3. **Inconsistency Report**
   List all cases where the same concept has multiple variations:
   - "Opslaan" vs "Bewaren" - locations of each
   - Other duplicates or near-duplicates

4. **Recommended Consolidations**
   For each inconsistency, recommend which variant to keep (prefer "Bewaren" for save operations).
</output>

<execution_guidance>
- Use Grep with patterns like `>([A-Z][a-zA-Z\s]+)<` to find JSX text
- Search for `toast\.(success|error|info)\(` patterns
- Search for common Dutch words: Opslaan, Bewaren, Annuleren, Verwijderen, Toevoegen, Bewerken, Laden
- Check placeholder, title, description props
- Be thorough - missing strings will cause inconsistency later
</execution_guidance>

<verification>
Before completing, verify:
- [ ] All files in src/app/admin/ have been scanned
- [ ] All files in src/components/admin/ have been scanned
- [ ] Toast messages are included
- [ ] AlertDialog content is included
- [ ] Empty states are included
- [ ] Loading states are included
- [ ] The inventory is organized by category
- [ ] Inconsistencies are clearly identified
</verification>
