"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSiteContext } from "@/lib/permissions/site-context";
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
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
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
import { t } from "@/config/strings";

interface Page {
  id: string;
  title: string;
  slug: string | null;
  is_homepage: boolean;
  updated_at: string;
}

export default function PagesPage() {
  const router = useRouter();
  const { currentSite, loading: siteLoading } = useSiteContext();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Page | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Duplicate
  const [duplicating, setDuplicating] = useState<string | null>(null);

  useEffect(() => {
    if (!siteLoading && currentSite) {
      fetchPages();
    }
  }, [currentSite, siteLoading]);

  const fetchPages = async () => {
    if (!currentSite) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/content/pages?siteId=${currentSite.id}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setPages(data);
    } catch {
      toast.error(t("admin.messages.pagesLoadFailed"));
    } finally {
      setLoading(false);
    }
  };

  const createPage = useCallback(async () => {
    if (!currentSite) return;
    setCreating(true);
    try {
      const response = await fetch("/api/admin/content/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: t("admin.misc.newPage"),
          slug: `nieuwe-pagina-${Date.now()}`,
          is_homepage: false,
          siteId: currentSite.id,
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
        error instanceof Error ? error.message : t("admin.messages.somethingWentWrongShort"),
      );
      setCreating(false);
    }
  }, [router, currentSite]);

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
      toast.success(t("admin.messages.pageDeleted"));
    } catch {
      toast.error(t("admin.messages.pageDeleteFailed"));
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
      toast.success(t("admin.messages.pageDuplicated"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("admin.messages.somethingWentWrongShort"),
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
        {t("admin.misc.newPage")}
      </Button>
    ),
    [createPage, creating],
  );
  useAdminHeaderActions(headerActions);

  const isLoading = loading || siteLoading;

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : pages.length === 0 ? (
        <Empty className="border py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileTextIcon className="size-5" />
            </EmptyMedia>
            <EmptyTitle>{t("admin.misc.noPagesYet")}</EmptyTitle>
            <EmptyDescription>
              {t("admin.misc.noPagesDesc")}
            </EmptyDescription>
          </EmptyHeader>
          <Button size="sm" onClick={createPage} disabled={creating}>
            {creating ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <PlusIcon className="size-4" />
            )}
            {t("admin.misc.createPage")}
          </Button>
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>{t("admin.labels.title")}</TableHead>
              <TableHead className="hidden sm:table-cell">{t("admin.labels.url")}</TableHead>
              <TableHead className="hidden md:table-cell">
                {t("admin.misc.lastEdited")}
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
                        {t("admin.buttons.duplicate")}
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
                        {t("admin.buttons.delete")}
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
            <AlertDialogTitle>{t("admin.misc.deletePageQuestion")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.misc.deletePageDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("admin.buttons.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={deletePage}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  {t("admin.buttons.deleting")}
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
