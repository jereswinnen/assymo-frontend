"use client";

import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { SolutionsScrollerSection } from "@/types/sections";
import { t } from "@/config/strings";

interface SolutionsScrollerFormProps {
  section: SolutionsScrollerSection;
  onChange: (section: SolutionsScrollerSection) => void;
}

export function SolutionsScrollerForm({
  section,
  onChange,
}: SolutionsScrollerFormProps) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="heading">{t("admin.labels.title")}</FieldLabel>
        <Input
          id="heading"
          value={section.heading || ""}
          onChange={(e) => onChange({ ...section, heading: e.target.value })}
          placeholder={t("admin.placeholders.solutionsHeading")}
        />
      </Field>
      <RichTextEditor
        label={t("admin.labels.subtitle")}
        value={section.subtitle || ""}
        onChange={(value) => onChange({ ...section, subtitle: value })}
        placeholder={t("admin.placeholders.solutionsSubtitle")}
      />
    </FieldGroup>
  );
}
