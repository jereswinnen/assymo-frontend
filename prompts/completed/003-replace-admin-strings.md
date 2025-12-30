<objective>
Replace ALL hardcoded strings in admin files with references to the centralized strings config.

This is Phase 3 of a string consolidation effort. Every hardcoded Dutch string in the admin interface must be replaced with a `t('key')` call.
</objective>

<context>
@./string-inventory.md - The inventory mapping strings to keys
@src/config/strings.ts - The centralized strings config (from Phase 2)

Files to update:
- All `.tsx` files in `src/app/admin/`
- All `.tsx` files in `src/components/admin/`
</context>

<requirements>
1. For each file with hardcoded strings:
   - Add import: `import { t } from '@/config/strings'`
   - Replace each hardcoded string with `t('corresponding.key')`

2. Handle different contexts:

   **JSX text content:**
   ```tsx
   // Before
   <Button>Bewaren</Button>

   // After
   <Button>{t('admin.buttons.save')}</Button>
   ```

   **String props:**
   ```tsx
   // Before
   <Input placeholder="Zoeken..." />

   // After
   <Input placeholder={t('admin.placeholders.search')} />
   ```

   **Toast messages:**
   ```tsx
   // Before
   toast.success("Wijzigingen opgeslagen")

   // After
   toast.success(t('admin.messages.changesSaved'))
   ```

   **Conditional rendering:**
   ```tsx
   // Before
   {saving ? "Bewaren..." : "Bewaren"}

   // After
   {saving ? t('admin.buttons.saving') : t('admin.buttons.save')}
   ```

   **Dynamic strings with interpolation:**
   ```tsx
   // Before
   `Weet u zeker dat u ${name} wilt verwijderen?`

   // After
   t('admin.messages.confirmDeleteUser', { name })
   ```

3. Preserve existing functionality - only change the string source, not behavior

4. Do NOT modify:
   - API response handling (server messages)
   - Console.log statements
   - Code comments
   - Non-user-facing strings (internal identifiers, etc.)
</requirements>

<implementation>
Process files systematically:
1. Start with `src/app/admin/` page files
2. Then `src/components/admin/` component files
3. For each file:
   - Read the file
   - Identify all hardcoded strings using the inventory
   - Apply replacements
   - Verify imports are added
   - Save the file

Keep track of progress - there are many files to update.
</implementation>

<output>
Update all admin files to use the centralized strings.

After completion, create `./string-replacement-report.md` documenting:
- Total files updated
- Total strings replaced
- Any strings that couldn't be replaced (and why)
- Any new strings discovered during replacement (add to config)
</output>

<verification>
Before completing, verify:
- [ ] Every file in src/app/admin/ has been checked and updated if needed
- [ ] Every file in src/components/admin/ has been checked and updated if needed
- [ ] All files with t() calls have the import statement
- [ ] No hardcoded Dutch strings remain (grep for common words to verify)
- [ ] Application still builds: `pnpm build`
- [ ] No TypeScript errors: `npx tsc --noEmit`
</verification>

<critical>
This phase involves modifying many files. Work carefully and verify each change preserves the original behavior. If unsure about a string replacement, err on the side of not replacing it and document it for review.
</critical>
