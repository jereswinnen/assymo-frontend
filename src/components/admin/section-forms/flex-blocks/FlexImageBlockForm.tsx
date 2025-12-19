"use client";

import { ImageUpload } from "@/components/admin/ImageUpload";
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
    <ImageUpload
      value={block.image || null}
      onChange={(value) => onChange({ ...block, image: value || undefined })}
    />
  );
}
