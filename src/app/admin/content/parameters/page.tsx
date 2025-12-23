"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAdminHeaderActions } from "@/components/admin/AdminHeaderContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { toast } from "sonner";
import { CheckIcon, Loader2Icon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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
  const [params, setParams] = useState<SiteParams>(defaultParams);
  const [originalParams, setOriginalParams] =
    useState<SiteParams>(defaultParams);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const hasChanges = JSON.stringify(params) !== JSON.stringify(originalParams);

  useEffect(() => {
    fetch("/api/admin/content/site-parameters")
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
        toast.error("Kon instellingen niet laden");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/content/site-parameters", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      setOriginalParams(params);
      toast.success("Instellingen opgeslagen");
    } catch (error) {
      console.error("Failed to save site parameters:", error);
      toast.error("Kon instellingen niet opslaan");
    } finally {
      setSaving(false);
    }
  }, [params]);

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
        Opslaan
      </Button>
    ),
    [saving, hasChanges, handleSave],
  );
  useAdminHeaderActions(headerActions);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <FieldGroup className="max-w-2xl">
      <FieldSet>
        <FieldLegend className="font-semibold">Contactgegevens</FieldLegend>
        <Field>
          <FieldLabel htmlFor="address">Adres</FieldLabel>
          <Input
            id="address"
            value={params.address}
            onChange={updateField("address")}
            placeholder="Straat 123, 1234 AB Plaats"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="phone">Telefoon</FieldLabel>
          <Input
            id="phone"
            value={params.phone}
            onChange={updateField("phone")}
            placeholder="+32 123 45 67 89"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">E-mail</FieldLabel>
          <Input
            id="email"
            type="email"
            value={params.email}
            onChange={updateField("email")}
            placeholder="info@assymo.be"
          />
        </Field>
      </FieldSet>

      <Separator />

      <FieldSet>
        <FieldLegend className="font-semibold">Sociale media</FieldLegend>
        <Field>
          <FieldLabel htmlFor="instagram">Instagram URL</FieldLabel>
          <Input
            id="instagram"
            type="url"
            value={params.instagram}
            onChange={updateField("instagram")}
            placeholder="https://instagram.com/assymo"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="facebook">Facebook URL</FieldLabel>
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
        <FieldLegend className="font-semibold">Bedrijfsgegevens</FieldLegend>
        <Field>
          <FieldLabel htmlFor="vat_number">BTW Nummer</FieldLabel>
          <Input
            id="vat_number"
            value={params.vat_number}
            onChange={updateField("vat_number")}
            placeholder="BE 0123.456.789"
          />
        </Field>
      </FieldSet>
    </FieldGroup>
  );
}
