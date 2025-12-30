"use client";

import { useEffect, useState, useMemo } from "react";
import { useAdminHeaderActions } from "@/components/admin/AdminHeaderContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import {
  CheckIcon,
  GlobeIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { t } from "@/config/strings";

interface Site {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  is_active: boolean;
  created_at: string;
}

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    domain: "",
  });
  const [deleteTarget, setDeleteTarget] = useState<Site | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      const response = await fetch("/api/admin/sites");
      if (!response.ok) {
        if (response.status === 403) {
          toast.error(t("admin.messages.noSiteAccess"));
          return;
        }
        throw new Error("Failed to load sites");
      }
      const data = await response.json();
      setSites(data.sites || []);
    } catch (error) {
      console.error("Failed to load sites:", error);
      toast.error(t("admin.messages.sitesLoadFailed"));
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingSite(null);
    setFormData({ name: "", slug: "", domain: "" });
    setDialogOpen(true);
  };

  const openEditDialog = (site: Site) => {
    setEditingSite(site);
    setFormData({
      name: site.name,
      slug: site.slug,
      domain: site.domain || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast.error(t("admin.messages.nameSlugRequired"));
      return;
    }

    setSaving(true);
    try {
      const url = editingSite
        ? `/api/admin/sites/${editingSite.id}`
        : "/api/admin/sites";
      const method = editingSite ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save");
      }

      toast.success(editingSite ? t("admin.misc.siteUpdated") : t("admin.misc.siteCreated"));
      setDialogOpen(false);
      loadSites();
    } catch (error) {
      console.error("Failed to save site:", error);
      toast.error(
        error instanceof Error ? error.message : t("admin.misc.siteCouldNotSave")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/sites/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete");
      }

      toast.success(t("admin.messages.siteDeleted"));
      setDeleteTarget(null);
      loadSites();
    } catch (error) {
      console.error("Failed to delete site:", error);
      toast.error(
        error instanceof Error ? error.message : t("admin.misc.siteCouldNotDelete")
      );
    } finally {
      setDeleting(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  // Header actions
  const headerActions = useMemo(
    () => (
      <Button size="sm" onClick={openCreateDialog}>
        <PlusIcon className="size-4" />
        {t("admin.headings.newSite")}
      </Button>
    ),
    []
  );
  useAdminHeaderActions(headerActions);

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sites.length === 0 ? (
        <div className="text-muted-foreground text-center text-sm py-8">
          {t("admin.misc.noSitesFound")}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.labels.name")}</TableHead>
              <TableHead>{t("admin.labels.slug")}</TableHead>
              <TableHead>{t("admin.labels.domain")}</TableHead>
              <TableHead>{t("admin.labels.status")}</TableHead>
              <TableHead>{t("admin.misc.created")}</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sites.map((site) => (
              <TableRow
                key={site.id}
                className="group cursor-pointer"
                onClick={() => openEditDialog(site)}
              >
                <TableCell className="font-medium">{site.name}</TableCell>
                <TableCell className="text-muted-foreground font-mono text-sm">
                  {site.slug}
                </TableCell>
                <TableCell>
                  {site.domain ? (
                    <div className="flex items-center gap-1 text-sm">
                      <GlobeIcon className="size-3 text-muted-foreground" />
                      {site.domain}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={site.is_active ? "default" : "secondary"}>
                    {site.is_active ? t("admin.misc.active") : t("admin.misc.inactive")}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(site.created_at)}
                </TableCell>
                <TableCell>
                  {site.slug !== "assymo" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(site);
                      }}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSite ? t("admin.headings.editSite") : t("admin.headings.newSite")}
            </DialogTitle>
          </DialogHeader>

          <FieldGroup>
            <FieldSet>
              <Field>
                <FieldLabel htmlFor="site-name">{t("admin.labels.name")}</FieldLabel>
                <Input
                  id="site-name"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      name,
                      // Auto-generate slug only for new sites
                      slug: editingSite ? prev.slug : generateSlug(name),
                    }));
                  }}
                  placeholder={t("admin.placeholders.siteName")}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="site-slug">Slug</FieldLabel>
                <Input
                  id="site-slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  placeholder={t("admin.placeholders.siteSlug")}
                  className="font-mono"
                  disabled={editingSite?.slug === "assymo"}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("admin.misc.slugHint")}
                </p>
              </Field>

              <Field>
                <FieldLabel htmlFor="site-domain">
                  {t("admin.labels.domain")} ({t("admin.placeholders.optional")})
                </FieldLabel>
                <Input
                  id="site-domain"
                  value={formData.domain}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, domain: e.target.value }))
                  }
                  placeholder={t("admin.placeholders.hostname")}
                />
              </Field>
            </FieldSet>
          </FieldGroup>

          <DialogFooter>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              {t("admin.buttons.cancel")}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <CheckIcon className="size-4" />
              )}
              {editingSite ? t("admin.buttons.save") : t("admin.buttons.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.misc.deleteSiteQuestion")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.dialogs.confirmDelete")} {t("admin.dialogs.cannotUndo")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("admin.buttons.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  {t("admin.loading.deleting")}
                </>
              ) : (
                t("admin.buttons.delete")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
