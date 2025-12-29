"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldGroup,
  FieldLabel,
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
import {
  CheckIcon,
  Loader2Icon,
  MailIcon,
  ShieldIcon,
  UserIcon,
  BuildingIcon,
  KeyIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { Role, Feature, FeatureOverrides } from "@/lib/permissions/types";
import { FEATURES, ROLE_FEATURES, SITE_SCOPED_FEATURES } from "@/lib/permissions/types";

interface Site {
  id: string;
  name: string;
  slug: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  feature_overrides: FeatureOverrides | null;
  created_at: string;
  two_factor_enabled: boolean;
  sites: Site[];
}

interface UserEditDialogProps {
  user: User | null;
  sites: Site[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  content_editor: "Content Editor",
};

const FEATURE_LABELS: Record<Feature, string> = {
  pages: "Pagina's",
  solutions: "Realisaties",
  navigation: "Navigatie",
  filters: "Filters",
  media: "Media",
  parameters: "Parameters",
  appointments: "Afspraken",
  emails: "E-mails",
  conversations: "Conversaties",
  settings: "Instellingen",
  users: "Gebruikers",
  sites: "Sites",
};

export function UserEditDialog({
  user,
  sites,
  open,
  onOpenChange,
  onUpdate,
}: UserEditDialogProps) {
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({
    role: "content_editor" as Role,
    siteIds: [] as string[],
    featureOverrides: null as FeatureOverrides | null,
  });

  // Initialize edit data when user changes
  useEffect(() => {
    if (user) {
      setEditData({
        role: user.role,
        siteIds: user.sites.map((s) => s.id),
        featureOverrides: user.feature_overrides,
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update");
      }

      toast.success("Gebruiker bijgewerkt");
      onOpenChange(false);
      onUpdate();
    } catch (error) {
      console.error("Failed to update user:", error);
      toast.error(
        error instanceof Error ? error.message : "Kon gebruiker niet bijwerken"
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleSite = (siteId: string) => {
    setEditData((prev) => ({
      ...prev,
      siteIds: prev.siteIds.includes(siteId)
        ? prev.siteIds.filter((id) => id !== siteId)
        : [...prev.siteIds, siteId],
    }));
  };

  const toggleFeatureOverride = (feature: Feature, type: "grant" | "revoke") => {
    setEditData((prev) => {
      const current = prev.featureOverrides || { grants: [], revokes: [] };
      const grants = current.grants || [];
      const revokes = current.revokes || [];

      if (type === "grant") {
        // Toggle grant
        const newGrants = grants.includes(feature)
          ? grants.filter((f) => f !== feature)
          : [...grants, feature];
        // Remove from revokes if adding to grants
        const newRevokes = revokes.filter((f) => f !== feature);
        return {
          ...prev,
          featureOverrides:
            newGrants.length === 0 && newRevokes.length === 0
              ? null
              : { grants: newGrants, revokes: newRevokes },
        };
      } else {
        // Toggle revoke
        const newRevokes = revokes.includes(feature)
          ? revokes.filter((f) => f !== feature)
          : [...revokes, feature];
        // Remove from grants if adding to revokes
        const newGrants = grants.filter((f) => f !== feature);
        return {
          ...prev,
          featureOverrides:
            newGrants.length === 0 && newRevokes.length === 0
              ? null
              : { grants: newGrants, revokes: newRevokes },
        };
      }
    });
  };

  // Get features that the role has by default
  const roleFeatures = ROLE_FEATURES[editData.role] || [];
  const allFeatures = Object.values(FEATURES);

  // Calculate effective features
  const grants = editData.featureOverrides?.grants || [];
  const revokes = editData.featureOverrides?.revokes || [];
  const effectiveFeatures = [
    ...roleFeatures.filter((f) => !revokes.includes(f)),
    ...grants.filter((f) => !roleFeatures.includes(f)),
  ];

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Gebruiker bewerken
            <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* User info (read-only) */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <UserIcon className="size-4 text-muted-foreground" />
              <span className="font-medium">{user.name}</span>
            </div>

            <div className="flex items-center gap-3">
              <MailIcon className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{user.email}</span>
            </div>

            <div className="flex items-center gap-3">
              <KeyIcon className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                2FA: {user.two_factor_enabled ? "Ingeschakeld" : "Uitgeschakeld"}
              </span>
            </div>
          </div>

          <Separator />

          <FieldGroup>
            {/* Role */}
            <FieldSet>
              <Field>
                <FieldLabel htmlFor="edit-role">Rol</FieldLabel>
                <Select
                  value={editData.role}
                  onValueChange={(value) =>
                    setEditData((prev) => ({
                      ...prev,
                      role: value as Role,
                      // Reset overrides when changing role
                      featureOverrides: null,
                    }))
                  }
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="content_editor">Content Editor</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {editData.role === "super_admin" &&
                    "Volledige toegang tot alles"}
                  {editData.role === "admin" &&
                    "Content + afspraken, e-mails, conversaties, instellingen"}
                  {editData.role === "content_editor" && "Alleen content beheren"}
                </p>
              </Field>
            </FieldSet>

            <FieldSeparator />

            {/* Site assignments */}
            <FieldSet>
              <Field>
                <FieldLabel className="flex items-center gap-2">
                  <BuildingIcon className="size-4" />
                  Toegewezen sites
                </FieldLabel>
                <div className="space-y-2 mt-2">
                  {sites.map((site) => (
                    <label
                      key={site.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={editData.siteIds.includes(site.id)}
                        onCheckedChange={() => toggleSite(site.id)}
                      />
                      <span className="text-sm">{site.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({site.slug})
                      </span>
                    </label>
                  ))}
                  {sites.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Geen sites beschikbaar
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Content features zijn beperkt tot de toegewezen sites
                </p>
              </Field>
            </FieldSet>

            {/* Feature overrides (only for non-super_admin) */}
            {editData.role !== "super_admin" && (
              <>
                <FieldSeparator />

                <FieldSet>
                  <Field>
                    <FieldLabel className="flex items-center gap-2">
                      <ShieldIcon className="size-4" />
                      Feature overrides
                    </FieldLabel>
                    <p className="text-xs text-muted-foreground mb-3">
                      Pas individuele features aan voor deze gebruiker
                    </p>

                    <div className="space-y-4">
                      {/* Content features */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Content features
                        </p>
                        <div className="space-y-1">
                          {SITE_SCOPED_FEATURES.map((feature) => {
                            const hasDefault = roleFeatures.includes(feature);
                            const isGranted = grants.includes(feature);
                            const isRevoked = revokes.includes(feature);
                            const isEffective = effectiveFeatures.includes(feature);

                            return (
                              <div
                                key={feature}
                                className="flex items-center justify-between py-1"
                              >
                                <span
                                  className={`text-sm ${
                                    !isEffective ? "text-muted-foreground line-through" : ""
                                  }`}
                                >
                                  {FEATURE_LABELS[feature]}
                                </span>
                                <div className="flex items-center gap-2">
                                  {hasDefault ? (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant={isRevoked ? "destructive" : "ghost"}
                                      className="h-6 text-xs"
                                      onClick={() =>
                                        toggleFeatureOverride(feature, "revoke")
                                      }
                                    >
                                      {isRevoked ? "Ingetrokken" : "Intrekken"}
                                    </Button>
                                  ) : (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant={isGranted ? "default" : "ghost"}
                                      className="h-6 text-xs"
                                      onClick={() =>
                                        toggleFeatureOverride(feature, "grant")
                                      }
                                    >
                                      {isGranted ? "Toegekend" : "Toekennen"}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Business features */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Business features
                        </p>
                        <div className="space-y-1">
                          {allFeatures
                            .filter(
                              (f) =>
                                !SITE_SCOPED_FEATURES.includes(f) &&
                                f !== "users" &&
                                f !== "sites"
                            )
                            .map((feature) => {
                              const hasDefault = roleFeatures.includes(feature);
                              const isGranted = grants.includes(feature);
                              const isRevoked = revokes.includes(feature);
                              const isEffective =
                                effectiveFeatures.includes(feature);

                              return (
                                <div
                                  key={feature}
                                  className="flex items-center justify-between py-1"
                                >
                                  <span
                                    className={`text-sm ${
                                      !isEffective
                                        ? "text-muted-foreground line-through"
                                        : ""
                                    }`}
                                  >
                                    {FEATURE_LABELS[feature]}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {hasDefault ? (
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant={isRevoked ? "destructive" : "ghost"}
                                        className="h-6 text-xs"
                                        onClick={() =>
                                          toggleFeatureOverride(feature, "revoke")
                                        }
                                      >
                                        {isRevoked ? "Ingetrokken" : "Intrekken"}
                                      </Button>
                                    ) : (
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant={isGranted ? "default" : "ghost"}
                                        className="h-6 text-xs"
                                        onClick={() =>
                                          toggleFeatureOverride(feature, "grant")
                                        }
                                      >
                                        {isGranted ? "Toegekend" : "Toekennen"}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  </Field>
                </FieldSet>
              </>
            )}
          </FieldGroup>

          <Separator />

          {/* Metadata */}
          <div className="text-xs text-muted-foreground">
            Aangemaakt op {new Date(user.created_at).toLocaleString("nl-NL")}
          </div>

          <DialogFooter>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuleren
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <CheckIcon className="size-4" />
              )}
              Opslaan
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
