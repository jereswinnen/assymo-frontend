"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CheckIcon,
  Loader2Icon,
  MailIcon,
  KeyIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import {
  type Role,
  type Feature,
  type FeatureOverrides,
  ROLE_FEATURES,
  SITE_SCOPED_FEATURES,
} from "@/lib/permissions/types";
import { getEffectiveFeatures } from "@/lib/permissions/check";

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

interface UserEditSheetProps {
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

const FEATURE_DESCRIPTIONS: Partial<Record<Feature, string>> = {
  pages: "Beheer website pagina's",
  solutions: "Beheer realisaties/projecten",
  navigation: "Beheer menu structuur",
  filters: "Beheer filter categorieën",
  media: "Beheer afbeeldingen en bestanden",
  parameters: "Beheer site parameters",
  appointments: "Bekijk en beheer afspraken",
  emails: "Verstuur nieuwsbrieven",
  conversations: "Bekijk chatbot gesprekken",
  settings: "Beheer site instellingen",
};

export function UserEditSheet({
  user,
  sites,
  open,
  onOpenChange,
  onUpdate,
}: UserEditSheetProps) {
  const [saving, setSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editData, setEditData] = useState({
    role: "content_editor" as Role,
    siteIds: [] as string[],
    featureOverrides: null as FeatureOverrides | null,
  });

  // Store initial data for change detection
  const [initialData, setInitialData] = useState<typeof editData | null>(null);

  // Initialize edit data when user changes
  useEffect(() => {
    if (user) {
      const data = {
        role: user.role,
        siteIds: user.sites.map((s) => s.id),
        featureOverrides: user.feature_overrides,
      };
      setEditData(data);
      setInitialData(data);
    }
  }, [user]);

  // Check if there are changes
  const hasChanges = useMemo(() => {
    if (!initialData) return false;
    return JSON.stringify(editData) !== JSON.stringify(initialData);
  }, [editData, initialData]);

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

  const handleDelete = async () => {
    if (!user) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete");
      }

      toast.success("Gebruiker verwijderd");
      setDeleteConfirmOpen(false);
      onOpenChange(false);
      onUpdate();
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error(
        error instanceof Error ? error.message : "Kon gebruiker niet verwijderen"
      );
    } finally {
      setDeleting(false);
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

  const toggleFeature = (feature: Feature) => {
    setEditData((prev) => {
      const roleFeatures = ROLE_FEATURES[prev.role] || [];
      const hasDefault = roleFeatures.includes(feature);
      const current = prev.featureOverrides || { grants: [], revokes: [] };
      const grants = current.grants || [];
      const revokes = current.revokes || [];

      let newGrants = [...grants];
      let newRevokes = [...revokes];

      if (hasDefault) {
        // Feature is granted by role - toggle revoke
        if (revokes.includes(feature)) {
          newRevokes = revokes.filter((f) => f !== feature);
        } else {
          newRevokes = [...revokes, feature];
        }
      } else {
        // Feature is not granted by role - toggle grant
        if (grants.includes(feature)) {
          newGrants = grants.filter((f) => f !== feature);
        } else {
          newGrants = [...grants, feature];
        }
      }

      return {
        ...prev,
        featureOverrides:
          newGrants.length === 0 && newRevokes.length === 0
            ? null
            : { grants: newGrants, revokes: newRevokes },
      };
    });
  };

  // Get features that the role has by default
  const roleFeatures = ROLE_FEATURES[editData.role] || [];

  // Get current overrides for UI state
  const grants = editData.featureOverrides?.grants || [];
  const revokes = editData.featureOverrides?.revokes || [];

  // Calculate effective features
  const effectiveFeatures = getEffectiveFeatures(editData.role, editData.featureOverrides);

  // Content features (site-scoped)
  const contentFeatures = SITE_SCOPED_FEATURES;

  // Business features (exclude users and sites which are admin-only)
  const businessFeatures: Feature[] = ["appointments", "emails", "conversations", "settings"];

  if (!user) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex flex-col overflow-hidden w-full md:max-w-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {user.name}
              <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
            </SheetTitle>
            <SheetDescription className="flex flex-col gap-1">
              <span className="flex items-center gap-2">
                <MailIcon className="size-3" />
                {user.email}
              </span>
              <span className="flex items-center gap-2">
                <KeyIcon className="size-3" />
                2FA: {user.two_factor_enabled ? "Ingeschakeld" : "Uitgeschakeld"}
              </span>
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4">
            <FieldGroup>
              <FieldSet>
                <Field>
                  <FieldLabel htmlFor="edit-role">Rol</FieldLabel>
                  <Select
                    value={editData.role}
                    onValueChange={(value) =>
                      setEditData((prev) => ({
                        ...prev,
                        role: value as Role,
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
                  <FieldDescription>
                    {editData.role === "super_admin" && "Volledige toegang tot alles"}
                    {editData.role === "admin" &&
                      "Content + afspraken, e-mails, conversaties, instellingen"}
                    {editData.role === "content_editor" && "Alleen content beheren"}
                  </FieldDescription>
                </Field>
              </FieldSet>

              <FieldSeparator />

              <FieldSet>
                <Field>
                  <FieldLabel>Toegewezen sites</FieldLabel>
                  <FieldDescription>
                    Content features zijn beperkt tot de toegewezen sites
                  </FieldDescription>
                  <div className="space-y-3 mt-3">
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
                          checked={editData.siteIds.includes(site.id)}
                          onCheckedChange={() => toggleSite(site.id)}
                        />
                      </div>
                    ))}
                    {sites.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Geen sites beschikbaar
                      </p>
                    )}
                  </div>
                </Field>
              </FieldSet>

              {editData.role !== "super_admin" && (
                <>
                  <FieldSeparator />

                  <FieldSet>
                    <Field>
                      <FieldLabel>Content features</FieldLabel>
                      <FieldDescription>
                        Beheer van website inhoud
                      </FieldDescription>
                      <div className="space-y-3 mt-3">
                        {contentFeatures.map((feature) => {
                          const isEnabled = effectiveFeatures.includes(feature);
                          const hasDefault = roleFeatures.includes(feature);
                          const isOverridden = hasDefault
                            ? revokes.includes(feature)
                            : grants.includes(feature);

                          return (
                            <div
                              key={feature}
                              className="flex items-center justify-between"
                            >
                              <div className="space-y-0.5">
                                <span className="text-sm font-medium flex items-center gap-2">
                                  {FEATURE_LABELS[feature]}
                                  {isOverridden && (
                                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                                      aangepast
                                    </Badge>
                                  )}
                                </span>
                                {FEATURE_DESCRIPTIONS[feature] && (
                                  <p className="text-xs text-muted-foreground">
                                    {FEATURE_DESCRIPTIONS[feature]}
                                  </p>
                                )}
                              </div>
                              <Switch
                                checked={isEnabled}
                                onCheckedChange={() => toggleFeature(feature)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </Field>
                  </FieldSet>

                  <FieldSeparator />

                  <FieldSet>
                    <Field>
                      <FieldLabel>Business features</FieldLabel>
                      <FieldDescription>
                        Beheer van bedrijfsprocessen
                      </FieldDescription>
                      <div className="space-y-3 mt-3">
                        {businessFeatures.map((feature) => {
                          const isEnabled = effectiveFeatures.includes(feature);
                          const hasDefault = roleFeatures.includes(feature);
                          const isOverridden = hasDefault
                            ? revokes.includes(feature)
                            : grants.includes(feature);

                          return (
                            <div
                              key={feature}
                              className="flex items-center justify-between"
                            >
                              <div className="space-y-0.5">
                                <span className="text-sm font-medium flex items-center gap-2">
                                  {FEATURE_LABELS[feature]}
                                  {isOverridden && (
                                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                                      aangepast
                                    </Badge>
                                  )}
                                </span>
                                {FEATURE_DESCRIPTIONS[feature] && (
                                  <p className="text-xs text-muted-foreground">
                                    {FEATURE_DESCRIPTIONS[feature]}
                                  </p>
                                )}
                              </div>
                              <Switch
                                checked={isEnabled}
                                onCheckedChange={() => toggleFeature(feature)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </Field>
                  </FieldSet>
                </>
              )}

              <FieldSeparator />

              <div className="text-xs text-muted-foreground">
                Aangemaakt op {new Date(user.created_at).toLocaleString("nl-NL")}
              </div>
            </FieldGroup>
          </div>

          <SheetFooter className="flex-row justify-between gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeleteConfirmOpen(true)}
            >
              <Trash2Icon className="size-4" />
              Verwijderen
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              {saving ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <CheckIcon className="size-4" />
              )}
              Opslaan
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gebruiker verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je &quot;{user?.name}&quot; wilt verwijderen?
              De gebruiker verliest alle toegang en site-toewijzingen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Verwijderen...
                </>
              ) : (
                "Verwijderen"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
