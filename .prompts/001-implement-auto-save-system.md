<objective>
Implement an extensible auto-save system for the admin CMS that automatically saves content when users make changes, reducing the risk of lost work while maintaining the existing manual "Opslaan" button as a fallback.

The system should combine on-blur and periodic interval saving strategies, with a subtle status indicator for feedback and silent retry on failure.
</objective>

<context>
This is a Next.js 15 admin CMS for Assymo. Currently, users must manually click "Opslaan" (Save) to persist changes. Users may forget to save, losing their work.

Key files to understand:
- `src/app/admin/content/pages/[id]/page.tsx` - Page editor with sections, title, slug, header image
- `src/app/admin/content/solutions/[id]/page.tsx` - Similar solution editor (likely same pattern)
- `src/components/admin/SectionList.tsx` - Manages section editing via Sheet panel
- `src/components/admin/SectionForm.tsx` - Routes to specific section type forms

Current architecture:
- Uses plain React state (useState) for form values
- `hasChanges` boolean tracks dirty state by comparing current values to loaded data
- `savePage()` function handles the actual API PUT request
- Forms call `onChange` callbacks to propagate changes up to parent
- Data saved to Neon Postgres database via API routes at `/api/admin/content/pages/[id]`
</context>

<requirements>
1. **Auto-save hook**: Create a reusable `useAutoSave` hook that can be applied to any admin form
   - Debounced save on blur (when user leaves a field or closes a Sheet)
   - Periodic save every 30 seconds if there are pending changes
   - Skip save if no changes exist (`hasChanges === false`)
   - Track pending/saving/saved/error states internally

2. **Save status indicator**: Create a small, unobtrusive status component
   - Shows "Opgeslagen" (Saved) briefly after successful save, then fades
   - Shows "Opslaan..." (Saving) while save is in progress
   - No visible error state (silent retry instead)
   - Position near the existing save button or in the sidebar header

3. **Silent retry on failure**: If a save fails (network error, etc.)
   - Retry up to 3 times with exponential backoff
   - Queue the save and retry when connection returns
   - Do not show error toasts for auto-save failures (unlike manual save)

4. **Navigation handling**: Auto-save before navigating away
   - Use Next.js router events or beforeunload to trigger save
   - Ensure pending saves complete before navigation proceeds

5. **Keep manual save button**: The existing "Opslaan" button should remain
   - Still works as before for users who prefer explicit saving
   - Disabled when no changes OR when auto-save is in progress

6. **Extensible pattern**: Design for reuse across all admin forms
   - The hook should accept the save function and hasChanges state
   - Should work with the solutions editor without duplication
</requirements>

<implementation>
Create these files:

1. `src/hooks/useAutoSave.ts` - The core auto-save hook
   - Parameters: `saveFn: () => Promise<void>`, `hasChanges: boolean`, `options?: AutoSaveOptions`
   - Options: `debounceMs`, `intervalMs`, `maxRetries`, `enabled`
   - Returns: `{ status: 'idle' | 'saving' | 'saved' | 'error', lastSavedAt: Date | null }`

2. `src/components/admin/SaveStatus.tsx` - Subtle status indicator component
   - Props: `status`, `lastSavedAt`
   - Shows appropriate Dutch text and transitions

Then integrate into:
- `src/app/admin/content/pages/[id]/page.tsx`
- `src/app/admin/content/solutions/[id]/page.tsx` (if it exists and follows same pattern)

Trigger saves on:
- Sheet close (when editing a section)
- Input blur (for title, slug fields)
- 30-second interval if changes exist
- Navigation away from page

Do NOT:
- Remove the existing manual save button
- Show error toasts for auto-save failures (only manual save failures should toast)
- Add excessive logging or debug output
</implementation>

<verification>
Before declaring complete:
1. Verify the build passes: `pnpm build`
2. Test manually in browser:
   - Edit a page title, wait 30 seconds → should auto-save
   - Edit a section in Sheet, close Sheet → should auto-save
   - Check that "Opgeslagen" appears briefly after save
   - Simulate offline (DevTools) → should silently queue and retry
   - Navigate away while editing → should save before leaving
3. Verify manual "Opslaan" button still works
4. Check that no TypeScript errors exist: `npx tsc --noEmit`
</verification>

<success_criteria>
- Auto-save hook is reusable and works with any form
- Page and solution editors auto-save on blur and interval
- Subtle "Opgeslagen"/"Opslaan..." indicator appears
- Failed saves retry silently without user-facing errors
- Navigation triggers save before leaving
- Manual save button remains functional
- No regressions in existing save behavior
</success_criteria>
