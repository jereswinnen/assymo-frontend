"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import type { Role } from "@/lib/permissions/types";
import { t } from "@/config/strings";

interface Site {
  id: string;
  name: string;
  slug: string;
}

interface UserCreateSheetProps {
  sites: Site[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function UserCreateSheet({
  sites,
  open,
  onOpenChange,
  onCreated,
}: UserCreateSheetProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "content_editor" as Role,
    siteIds: [] as string[],
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      role: "content_editor",
      siteIds: [],
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error(t("admin.messages.nameEmailRequired"));
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create user");
      }

      toast.success(t("admin.messages.userCreated"));
      handleOpenChange(false);
      onCreated();
    } catch (error) {
      console.error("Failed to create user:", error);
      toast.error(
        error instanceof Error ? error.message : t("admin.messages.somethingWentWrong"),
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleSite = (siteId: string) => {
    setFormData((prev) => ({
      ...prev,
      siteIds: prev.siteIds.includes(siteId)
        ? prev.siteIds.filter((id) => id !== siteId)
        : [...prev.siteIds, siteId],
    }));
  };

  const isFormValid = formData.name.trim() && formData.email.trim();

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex flex-col overflow-hidden w-full md:max-w-xl">
        <SheetHeader>
          <SheetTitle>{t("admin.headings.newUser")}</SheetTitle>
          <SheetDescription>
            {t("admin.dialogs.userWillReceiveEmail")}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <FieldGroup>
            <FieldSet>
              <Field>
                <FieldLabel htmlFor="user-name">{t("admin.labels.name")}</FieldLabel>
                <Input
                  id="user-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder={t("admin.placeholders.userName")}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="user-email">{t("admin.labels.email")}</FieldLabel>
                <Input
                  id="user-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder={t("admin.placeholders.userEmail")}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="user-role">{t("admin.labels.role")}</FieldLabel>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, role: value as Role }))
                  }
                >
                  <SelectTrigger id="user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="content_editor">
                      Content Editor
                    </SelectItem>
                    <SelectItem value="user">Gebruiker</SelectItem>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  {formData.role === "super_admin" &&
                    "Volledige toegang tot alles"}
                  {formData.role === "admin" &&
                    "Content + afspraken, e-mails, conversaties, instellingen"}
                  {formData.role === "content_editor" &&
                    "Alleen content beheren"}
                  {formData.role === "user" &&
                    "Geen standaard toegang - features moeten expliciet worden toegekend"}
                </FieldDescription>
              </Field>
            </FieldSet>

            <FieldSeparator />

            <FieldSet>
              <Field>
                <FieldLabel>{t("admin.misc.sites")}</FieldLabel>
                <FieldDescription>
                  Content features zijn beperkt tot de toegewezen sites
                </FieldDescription>
                <div className="space-y-3">
                  {sites.map((site) => (
                    <div
                      key={site.id}
                      className="flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <span className="text-sm font-medium">{site.name}</span>
                        <p className="text-xs text-muted-foreground">
                          {site.slug}
                        </p>
                      </div>
                      <Switch
                        checked={formData.siteIds.includes(site.id)}
                        onCheckedChange={() => toggleSite(site.id)}
                      />
                    </div>
                  ))}
                  {sites.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      {t("admin.misc.noSitesAvailable")}
                    </p>
                  )}
                </div>
              </Field>
            </FieldSet>
          </FieldGroup>
        </div>

        <SheetFooter>
          <Button onClick={handleCreate} disabled={saving || !isFormValid}>
            {saving ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <CheckIcon className="size-4" />
            )}
            {t("admin.buttons.create")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
