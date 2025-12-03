import Image from "next/image";
import { urlFor } from "@/sanity/imageUrl";
import type { FlexImageBlock } from "../types";

interface ImageBlockProps {
  block: FlexImageBlock;
}

export default function ImageBlock({ block }: ImageBlockProps) {
  const { image } = block;

  if (!image?.asset) return null;

  let imageUrl: string;
  try {
    imageUrl = urlFor(image).width(1200).quality(80).url();
  } catch (error) {
    console.error("Failed to generate image URL:", error);
    return null;
  }

  return (
    <div className="relative aspect-5/3 overflow-hidden">
      <Image
        src={imageUrl}
        alt={image.alt || ""}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    </div>
  );
}
