<objective>
Final verification pass to ensure NO hardcoded Dutch strings remain in the admin interface.

This is Phase 4 (final) of the string consolidation effort. Perform exhaustive verification that all strings have been migrated to the centralized config.
</objective>

<context>
@src/config/strings.ts - The centralized strings config
@./string-replacement-report.md - Report from Phase 3

The previous phases should have:
1. Discovered all strings (Phase 1)
2. Created the config file (Phase 2)
3. Replaced all strings (Phase 3)

This phase ensures nothing was missed.
</context>

<requirements>
1. **Exhaustive Search**
   Run comprehensive grep searches for:
   - Common Dutch words: Opslaan, Bewaren, Annuleren, Verwijderen, Toevoegen, Bewerken, Wijzigen, Laden, Zoeken, Filteren, Versturen, Selecteren, Kiezen, Nieuw, Nieuwe
   - Common button patterns: `>text</Button>`, `>text</button>`
   - Placeholder patterns: `placeholder="`, `placeholder={'`
   - Toast patterns: `toast.success(`, `toast.error(`, `toast.info(`
   - Title/description props: `title="`, `description="`

2. **False Positive Filtering**
   Exclude from findings:
   - Import statements
   - Comments
   - The strings config file itself
   - Console.log for debugging
   - Server-side only code
   - Test files

3. **Address Any Findings**
   For each hardcoded string found:
   - Add to strings.ts if missing
   - Replace in source file with t() call
   - Document the addition

4. **Type Safety Check**
   Verify that all t() calls use valid keys:
   - TypeScript should catch invalid keys
   - Run `npx tsc --noEmit` to verify
</requirements>

<searches_to_run>
```bash
# Search for common Dutch action words
grep -rn "Opslaan\|Bewaren\|Annuleren\|Verwijderen\|Toevoegen\|Bewerken" src/app/admin/ src/components/admin/

# Search for potential missed strings in JSX
grep -rn ">[A-Z][a-z].*</" src/app/admin/ src/components/admin/

# Search for placeholder attributes with Dutch text
grep -rn 'placeholder="[A-Z]' src/app/admin/ src/components/admin/

# Search for toast messages
grep -rn 'toast\.\(success\|error\|info\)("[A-Z]' src/app/admin/ src/components/admin/

# Verify all admin files import t() if they use strings
grep -L "from '@/config/strings'" src/app/admin/**/*.tsx src/components/admin/**/*.tsx 2>/dev/null
```
</searches_to_run>

<output>
Create `./final-verification-report.md` with:

1. **Verification Summary**
   - Total files scanned
   - Hardcoded strings found (should be 0)
   - Files missing t() import (should be 0)
   - TypeScript errors (should be 0)

2. **Remaining Issues** (if any)
   List any strings that couldn't be migrated and why

3. **Build Verification**
   - Result of `pnpm build`
   - Result of `npx tsc --noEmit`
   - Result of `pnpm lint`

4. **Completion Confirmation**
   Explicit statement that all admin strings are now centralized
</output>

<verification>
Before declaring complete:
- [ ] All grep searches return no results (or only false positives)
- [ ] `npx tsc --noEmit` passes with no errors
- [ ] `pnpm build` succeeds
- [ ] `pnpm lint` passes
- [ ] Manual spot-check of 3-5 random admin pages confirms t() usage
</verification>

<success_criteria>
The task is complete when:
1. Zero hardcoded Dutch strings remain in admin files
2. All strings are accessed via t() from src/config/strings.ts
3. Application builds and runs without errors
4. TypeScript provides autocomplete for all string keys
</success_criteria>
