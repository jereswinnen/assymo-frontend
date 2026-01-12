"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface RichTextProps {
  html: string;
  className?: string;
}

export function RichText({ html, className }: RichTextProps) {
  const [sanitizedHtml, setSanitizedHtml] = useState<string>("");

  useEffect(() => {
    if (!html || html === "<p></p>") {
      setSanitizedHtml("");
      return;
    }

    // DOMPurify only works on the client
    import("dompurify").then((DOMPurify) => {
      setSanitizedHtml(DOMPurify.default.sanitize(html));
    });
  }, [html]);

  if (!sanitizedHtml) {
    return null;
  }

  return (
    <div
      className={cn(
        "prose prose-sm max-w-none [&_p:empty]:min-h-[1em] [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:my-4 [&_a]:text-primary [&_a]:underline",
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
