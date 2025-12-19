"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { toast } from "sonner";
import {
  CopyIcon,
  FileTextIcon,
  HomeIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { formatDateWithTime } from "@/lib/format";
import { useAdminHeaderActions } from "@/components/admin/AdminHeaderContext";

interface Page {
  id: string;
  title: string;
  slug: string | null;
  is_homepage: boolean;
  updated_at: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function PagesPage() {
  const router = useRouter();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  // New page dialog
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newIsHomepage, setNewIsHomepage] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Page | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Duplicate
  const [duplicating, setDuplicating] = useState<string | null>(null);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/content/pages");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setPages(data);
    } catch {
      toast.error("Kon pagina's niet ophalen");
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (value: string) => {
    setNewTitle(value);
    if (autoSlug) {
      setNewSlug(slugify(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setNewSlug(value);
    setAutoSlug(false);
  };

  const openNewDialog = useCallback(() => {
    setNewTitle("");
    setNewSlug("");
    setNewIsHomepage(false);
    setAutoSlug(true);
    setIsNewDialogOpen(true);
  }, []);

  const createPage = async () => {
    if (!newTitle.trim()) {
      toast.error("Titel is verplicht");
      return;
    }

    if (!newIsHomepage && !newSlug.trim()) {
      toast.error("Slug is verplicht voor niet-homepage pagina's");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/content/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          slug: newIsHomepage ? null : newSlug.trim(),
          is_homepage: newIsHomepage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create");
      }

      const newPage = await response.json();
      // If new page is homepage, update other pages' is_homepage to false
      if (newPage.is_homepage) {
        setPages((prev) =>
          [...prev.map((p) => ({ ...p, is_homepage: false })), newPage].sort(
            (a, b) =>
              (b.is_homepage ? 1 : 0) - (a.is_homepage ? 1 : 0) ||
              a.title.localeCompare(b.title),
          ),
        );
      } else {
        setPages((prev) =>
          [...prev, newPage].sort(
            (a, b) =>
              (b.is_homepage ? 1 : 0) - (a.is_homepage ? 1 : 0) ||
              a.title.localeCompare(b.title),
          ),
        );
      }
      setIsNewDialogOpen(false);
      toast.success("Pagina aangemaakt");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Kon pagina niet aanmaken",
      );
    } finally {
      setSaving(false);
    }
  };

  const deletePage = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const response = await fetch(
        `/api/admin/content/pages/${deleteTarget.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) throw new Error("Failed to delete");

      setPages((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Pagina verwijderd");
    } catch {
      toast.error("Kon pagina niet verwijderen");
    } finally {
      setDeleting(false);
    }
  };

  const duplicatePage = async (page: Page) => {
    setDuplicating(page.id);
    try {
      const response = await fetch(
        `/api/admin/content/pages/${page.id}/duplicate`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to duplicate");
      }

      const newPage = await response.json();
      setPages((prev) =>
        [...prev, newPage].sort(
          (a, b) =>
            (b.is_homepage ? 1 : 0) - (a.is_homepage ? 1 : 0) ||
            a.title.localeCompare(b.title),
        ),
      );
      toast.success("Pagina gedupliceerd");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Kon pagina niet dupliceren",
      );
    } finally {
      setDuplicating(null);
    }
  };

  // Header actions
  const headerActions = useMemo(
    () => (
      <Button size="sm" onClick={openNewDialog}>
        <PlusIcon className="size-4" />
        Nieuwe pagina
      </Button>
    ),
    [openNewDialog],
  );
  useAdminHeaderActions(headerActions);

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : pages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <FileTextIcon className="size-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Nog geen pagina&apos;s</p>
          <Button size="sm" onClick={openNewDialog}>
            <PlusIcon className="size-4" />
            Eerste pagina aanmaken
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Titel</TableHead>
              <TableHead className="hidden sm:table-cell">URL</TableHead>
              <TableHead className="hidden md:table-cell">
                Laatst bewerkt
              </TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.map((page) => (
              <TableRow
                key={page.id}
                className="cursor-pointer"
                onClick={() => router.push(`/admin/content/pages/${page.id}`)}
              >
                <TableCell>
                  {page.is_homepage && <HomeIcon className="size-4" />}
                </TableCell>
                <TableCell className="font-medium">{page.title}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {page.is_homepage ? "/" : `/${page.slug}`}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {formatDateWithTime(page.updated_at)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontalIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicatePage(page);
                        }}
                        disabled={duplicating === page.id}
                      >
                        {duplicating === page.id ? (
                          <Loader2Icon className="size-4 animate-spin" />
                        ) : (
                          <CopyIcon className="size-4" />
                        )}
                        Dupliceren
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(page);
                        }}
                        disabled={page.is_homepage}
                      >
                        <Trash2Icon className="size-4" />
                        Verwijderen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* New Page Dialog */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuwe pagina</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_homepage">Homepage</Label>
                <p className="text-xs text-muted-foreground">
                  Dit is de hoofdpagina van de website
                </p>
              </div>
              <Switch
                id="is_homepage"
                checked={newIsHomepage}
                onCheckedChange={setNewIsHomepage}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Pagina titel"
              />
            </div>
            {!newIsHomepage && (
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={newSlug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="pagina-slug"
                />
                <p className="text-xs text-muted-foreground">
                  URL: /{newSlug || "..."}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsNewDialogOpen(false)}
              disabled={saving}
            >
              Annuleren
            </Button>
            <Button size="sm" onClick={createPage} disabled={saving || !newTitle.trim()}>
              {saving ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Aanmaken...
                </>
              ) : (
                "Aanmaken"
              )}
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
            <AlertDialogTitle>Pagina verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je &quot;{deleteTarget?.title}&quot; wilt
              verwijderen? Dit kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={deletePage}
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
    </div>
  );
}
