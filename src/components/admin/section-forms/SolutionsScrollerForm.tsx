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
        <FieldLabel htmlFor="heading">Titel</FieldLabel>
        <Input
          id="heading"
          value={section.heading || ""}
          onChange={(e) => onChange({ ...section, heading: e.target.value })}
          placeholder="Onze realisaties"
        />
      </Field>
      <RichTextEditor
        label="Subtitel"
        value={section.subtitle || ""}
        onChange={(value) => onChange({ ...section, subtitle: value })}
        placeholder="Bekijk onze projecten"
      />
    </FieldGroup>
  );
}
