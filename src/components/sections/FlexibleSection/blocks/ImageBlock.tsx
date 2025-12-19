import Image from "next/image";
import type { FlexImageBlock } from "../types";

interface ImageBlockProps {
  block: FlexImageBlock;
}

export default function ImageBlock({ block }: ImageBlockProps) {
  const { image } = block;

  if (!image?.url) return null;

  return (
    <div className="relative aspect-5/3 overflow-hidden">
      <Image
        src={image.url}
        alt={image.alt || ""}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    </div>
  );
}
