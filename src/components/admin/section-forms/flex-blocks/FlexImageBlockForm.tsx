"use client";

import { Field, FieldLabel } from "@/components/ui/field";
import { ImageUpload } from "@/components/admin/media/ImageUpload";
import { FlexImageBlock } from "@/types/sections";

interface FlexImageBlockFormProps {
  block: FlexImageBlock;
  onChange: (block: FlexImageBlock) => void;
}

export function FlexImageBlockForm({
  block,
  onChange,
}: FlexImageBlockFormProps) {
  return (
    <Field>
      <FieldLabel>Afbeelding</FieldLabel>
      <ImageUpload
        value={block.image || null}
        onChange={(value) => onChange({ ...block, image: value || undefined })}
      />
    </Field>
  );
}
