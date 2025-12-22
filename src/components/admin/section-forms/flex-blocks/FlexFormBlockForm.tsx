"use client";

import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FlexFormBlock } from "@/types/sections";

interface FlexFormBlockFormProps {
  block: FlexFormBlock;
  onChange: (block: FlexFormBlock) => void;
}

export function FlexFormBlockForm({
  block,
  onChange,
}: FlexFormBlockFormProps) {
  return (
    <FieldGroup>
      <FieldDescription>
        Dit blok toont het contactformulier met een optionele titel en subtitel.
      </FieldDescription>

      <Field>
        <FieldLabel>Titel</FieldLabel>
        <Input
          value={block.title || ""}
          onChange={(e) => onChange({ ...block, title: e.target.value })}
          placeholder="Formulier titel"
        />
      </Field>

      <Field>
        <FieldLabel>Subtitel</FieldLabel>
        <Input
          value={block.subtitle || ""}
          onChange={(e) => onChange({ ...block, subtitle: e.target.value })}
          placeholder="Optionele subtitel"
        />
      </Field>
    </FieldGroup>
  );
}
