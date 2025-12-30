<objective>
Create the centralized strings configuration file based on the discovered string inventory.

This is Phase 2 of a string consolidation effort. Using the inventory from `./string-inventory.md`, create a well-structured strings file with a helper function for easy access.
</objective>

<context>
@./string-inventory.md - The complete inventory of discovered strings (from Phase 1)
@src/config/ - Existing config files for reference on code style

Consolidation preferences:
- Use "Bewaren" for save (not "Opslaan")
- Use "Versturen" for send (not "Verstuur")
- Standardize loading states to "Laden..."
- Standardize deletion loading to "Verwijderen..."
</context>

<requirements>
1. Create `src/config/strings.ts` with:
   - TypeScript const object `ADMIN_STRINGS` containing all strings
   - Organized using dot notation keys matching the inventory categories
   - Helper function `t(key: string)` for type-safe string access

2. Key naming conventions:
   - Use dot notation: `admin.buttons.save`
   - Categories: buttons, labels, headings, messages, placeholders, empty, loading, validation
   - Specific enough to be unique but not overly verbose
   - Use descriptive names: `admin.buttons.delete` not `admin.buttons.btn1`

3. Handle dynamic strings:
   - For strings with variables like "Weet u zeker dat u {name} wilt verwijderen?"
   - Create a function variant: `admin.messages.confirmDelete` with placeholder syntax
   - Document how to use interpolation

4. Apply consolidations:
   - Replace all "Opslaan" with "Bewaren"
   - Standardize similar strings to single variants
   - Ensure consistent punctuation and capitalization

5. Add JSDoc comments for each category explaining its purpose
</requirements>

<output>
Create `./src/config/strings.ts` with structure like:

```typescript
/**
 * Centralized admin UI strings for consistent Dutch language usage.
 * Access via t() helper: t('admin.buttons.save')
 */

export const ADMIN_STRINGS = {
  admin: {
    buttons: {
      save: 'Bewaren',
      saving: 'Bewaren...',
      cancel: 'Annuleren',
      delete: 'Verwijderen',
      deleting: 'Verwijderen...',
      // ... more buttons
    },
    labels: {
      // Form labels
    },
    // ... more categories
  }
} as const;

type StringKeys = /* derived type for autocomplete */;

/**
 * Get a string by dot-notation key with optional interpolation.
 * @example t('admin.buttons.save') // "Bewaren"
 * @example t('admin.messages.confirmDelete', { name: 'John' })
 */
export function t(key: StringKeys, params?: Record<string, string>): string {
  // Implementation
}
```
</output>

<verification>
Before completing, verify:
- [ ] All strings from inventory are included
- [ ] No duplicate values exist (consolidation applied)
- [ ] "Opslaan" does NOT appear - replaced with "Bewaren"
- [ ] Key naming follows dot notation convention
- [ ] TypeScript types provide autocomplete for keys
- [ ] t() helper function works for both simple and parameterized strings
- [ ] File follows existing code style from src/config/
</verification>
