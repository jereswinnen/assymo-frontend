"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { formatDateWithTime } from "@/lib/format";
import { useAdminHeaderActions } from "@/components/admin/AdminHeaderContext";

interface Page {
  id: string;
  title: string;
  slug: string | null;
  is_homepage: boolean;
  updated_at: string;
}

export default function PagesPage() {
  const router = useRouter();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

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

  const createPage = useCallback(async () => {
    setCreating(true);
    try {
      const response = await fetch("/api/admin/content/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Nieuwe pagina",
          slug: `nieuwe-pagina-${Date.now()}`,
          is_homepage: false,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create");
      }

      const newPage = await response.json();
      router.push(`/admin/content/pages/${newPage.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Kon pagina niet aanmaken",
      );
      setCreating(false);
    }
  }, [router]);

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
      <Button size="sm" onClick={createPage} disabled={creating}>
        {creating ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <PlusIcon className="size-4" />
        )}
        Nieuwe pagina
      </Button>
    ),
    [createPage, creating],
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
          <Button size="sm" onClick={createPage} disabled={creating}>
            {creating ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <PlusIcon className="size-4" />
            )}
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
                  <div className="flex items-center justify-center">
                    {page.is_homepage && (
                      <Tooltip>
                        <TooltipTrigger>
                          <HomeIcon className="size-4  opacity-80" />
                        </TooltipTrigger>
                        <TooltipContent>Homepage</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
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
