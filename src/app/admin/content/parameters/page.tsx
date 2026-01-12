"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAdminHeaderActions } from "@/components/admin/AdminHeaderContext";
import { useSiteContext } from "@/lib/permissions/site-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { toast } from "sonner";
import {
  AtSignIcon,
  Building2Icon,
  CheckIcon,
  Loader2Icon,
  Share2Icon,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { t } from "@/config/strings";

interface SiteParams {
  address: string;
  phone: string;
  email: string;
  instagram: string;
  facebook: string;
  vat_number: string;
}

const defaultParams: SiteParams = {
  address: "",
  phone: "",
  email: "",
  instagram: "",
  facebook: "",
  vat_number: "",
};

export default function SiteParametersPage() {
  const { currentSite, loading: siteLoading } = useSiteContext();
  const [params, setParams] = useState<SiteParams>(defaultParams);
  const [originalParams, setOriginalParams] =
    useState<SiteParams>(defaultParams);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const hasChanges = JSON.stringify(params) !== JSON.stringify(originalParams);

  useEffect(() => {
    if (!siteLoading && currentSite) {
      setLoading(true);
      fetch(`/api/admin/content/site-parameters?siteId=${currentSite.id}`)
        .then((r) => r.json())
        .then((data) => {
          const loadedParams = {
            address: data.address || "",
            phone: data.phone || "",
            email: data.email || "",
            instagram: data.instagram || "",
            facebook: data.facebook || "",
            vat_number: data.vat_number || "",
          };
          setParams(loadedParams);
          setOriginalParams(loadedParams);
        })
        .catch((error) => {
          console.error("Failed to load site parameters:", error);
          toast.error(t("admin.messages.settingsLoadFailed"));
        })
        .finally(() => setLoading(false));
    }
  }, [currentSite, siteLoading]);

  const handleSave = useCallback(async () => {
    if (!currentSite) return;
    setSaving(true);
    try {
      const response = await fetch("/api/admin/content/site-parameters", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...params, siteId: currentSite.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      setOriginalParams(params);
      toast.success(t("admin.messages.parametersSaved"));
    } catch (error) {
      console.error("Failed to save site parameters:", error);
      toast.error(t("admin.messages.settingsSaveFailed"));
    } finally {
      setSaving(false);
    }
  }, [params, currentSite]);

  const updateField =
    (field: keyof SiteParams) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setParams((prev) => ({ ...prev, [field]: e.target.value }));
    };

  // Header actions
  const headerActions = useMemo(
    () => (
      <Button size="sm" onClick={handleSave} disabled={saving || !hasChanges}>
        {saving ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <CheckIcon className="size-4" />
        )}
        {t("admin.buttons.save")}
      </Button>
    ),
    [saving, hasChanges, handleSave],
  );
  useAdminHeaderActions(headerActions);

  const isLoading = loading || siteLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <FieldGroup className="max-w-2xl">
      <FieldSet>
        <FieldLegend className="flex items-center gap-1.5 font-semibold">
          <AtSignIcon className="size-4 opacity-80" />
          {t("admin.misc.contactInfo")}
        </FieldLegend>
        <RichTextEditor
          label={t("admin.labels.address")}
          value={params.address}
          onChange={(value) => setParams((prev) => ({ ...prev, address: value }))}
        />
        <Field>
          <FieldLabel htmlFor="phone">{t("admin.labels.phone")}</FieldLabel>
          <Input
            id="phone"
            value={params.phone}
            onChange={updateField("phone")}
            placeholder={t("admin.placeholders.phoneFormat2")}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">{t("admin.labels.email")}</FieldLabel>
          <Input
            id="email"
            type="email"
            value={params.email}
            onChange={updateField("email")}
            placeholder={t("admin.placeholders.companyEmail")}
          />
        </Field>
      </FieldSet>

      <Separator />

      <FieldSet>
        <FieldLegend className="flex items-center gap-1.5 font-semibold">
          <Share2Icon className="size-4 opacity-80" />
          {t("admin.misc.socialMedia")}
        </FieldLegend>
        <Field>
          <FieldLabel htmlFor="instagram">{t("admin.labels.instagramUrl")}</FieldLabel>
          <Input
            id="instagram"
            type="url"
            value={params.instagram}
            onChange={updateField("instagram")}
            placeholder="https://instagram.com/assymo"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="facebook">{t("admin.labels.facebookUrl")}</FieldLabel>
          <Input
            id="facebook"
            type="url"
            value={params.facebook}
            onChange={updateField("facebook")}
            placeholder="https://facebook.com/assymo"
          />
        </Field>
      </FieldSet>

      <Separator />

      <FieldSet>
        <FieldLegend className="flex items-center gap-1.5 font-semibold">
          <Building2Icon className="size-4 opacity-80" />
          {t("admin.misc.companyInfo")}
        </FieldLegend>
        <Field>
          <FieldLabel htmlFor="vat_number">{t("admin.labels.vatNumber")}</FieldLabel>
          <Input
            id="vat_number"
            value={params.vat_number}
            onChange={updateField("vat_number")}
            placeholder={t("admin.placeholders.vatFormat")}
          />
        </Field>
      </FieldSet>
    </FieldGroup>
  );
}
