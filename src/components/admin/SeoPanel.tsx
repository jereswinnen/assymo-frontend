"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Loader2Icon, SparklesIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/config/strings";

interface SeoPanelProps {
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  onMetaTitleChange: (value: string) => void;
  onMetaDescriptionChange: (value: string) => void;
  onGenerateDescription: () => Promise<void>;
  generating?: boolean;
  domain?: string;
  basePath?: string;
  siteName?: string;
}

// Character limits for SEO
const TITLE_MIN = 30;
const TITLE_MAX = 60;
const DESC_MIN = 120;
const DESC_MAX = 160;

function getCharacterStatus(
  length: number,
  min: number,
  max: number
): "good" | "warning" | "error" {
  if (length === 0) return "warning";
  if (length < min) return "warning";
  if (length > max) return "error";
  return "good";
}

function CharacterCounter({
  current,
  min,
  max,
}: {
  current: number;
  min: number;
  max: number;
}) {
  const status = getCharacterStatus(current, min, max);

  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        status === "good" && "text-green-600",
        status === "warning" && "text-amber-600",
        status === "error" && "text-red-600"
      )}
    >
      {current}/{max} {t("admin.misc.characters")}
    </span>
  );
}

export function SeoPanel({
  title,
  slug,
  metaTitle,
  metaDescription,
  onMetaTitleChange,
  onMetaDescriptionChange,
  onGenerateDescription,
  generating = false,
  domain = "https://assymo.be",
  basePath = "",
  siteName = "Assymo",
}: SeoPanelProps) {
  // Display title for preview (use metaTitle or fall back to title)
  const displayTitle = metaTitle || title || "Pagina titel";
  const fullTitle = `${displayTitle} — ${siteName}`;
  const displayUrl = `${domain}${basePath}${slug ? `/${slug}` : ""}`;
  const displayDescription =
    metaDescription || "Voeg een meta beschrijving toe voor zoekmachines...";

  return (
    <div className="space-y-4">
      {/* Google Preview */}
      <div className="rounded-lg border bg-white p-4">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          {t("admin.misc.seoPreview")}
        </p>
        <div className="space-y-1">
          {/* Title - Google blue link */}
          <p
            className="line-clamp-1 text-lg leading-tight text-[#1a0dab] hover:underline"
            style={{ fontFamily: "arial, sans-serif" }}
          >
            {fullTitle}
          </p>
          {/* URL - Google green */}
          <p
            className="text-sm text-[#006621]"
            style={{ fontFamily: "arial, sans-serif" }}
          >
            {displayUrl}
          </p>
          {/* Description */}
          <p
            className="line-clamp-2 text-sm text-[#545454]"
            style={{ fontFamily: "arial, sans-serif" }}
          >
            {displayDescription}
          </p>
        </div>
      </div>

      {/* SEO Fields */}
      <FieldSet>
        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="meta_title">
              {t("admin.labels.metaTitle")}
            </FieldLabel>
            <CharacterCounter
              current={metaTitle.length}
              min={TITLE_MIN}
              max={TITLE_MAX}
            />
          </div>
          <Input
            id="meta_title"
            value={metaTitle}
            onChange={(e) => onMetaTitleChange(e.target.value)}
            placeholder={title || t("admin.placeholders.metaTitlePlaceholder")}
          />
          <FieldDescription>
            {t("admin.misc.seoTitleHint")}
          </FieldDescription>
        </Field>

        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="meta_description">
              {t("admin.labels.metaDescription")}
            </FieldLabel>
            <CharacterCounter
              current={metaDescription.length}
              min={DESC_MIN}
              max={DESC_MAX}
            />
          </div>
          <div className="space-y-2">
            <Textarea
              id="meta_description"
              value={metaDescription}
              onChange={(e) => onMetaDescriptionChange(e.target.value)}
              placeholder={t("admin.placeholders.metaDescriptionPlaceholder")}
              rows={3}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onGenerateDescription}
              disabled={generating}
              className="w-full"
            >
              {generating ? (
                <>
                  <Loader2Icon className="size-3 animate-spin" />
                  {t("admin.loading.generating")}
                </>
              ) : (
                <>
                  <SparklesIcon className="size-3" />
                  {t("admin.misc.generateDescription")}
                </>
              )}
            </Button>
          </div>
        </Field>
      </FieldSet>
    </div>
  );
}
