"use client";

import { Suspense, useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { useSiteContext } from "@/lib/permissions/site-context";
import { useRequireFeature } from "@/lib/permissions/useRequireFeature";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  CloudUploadIcon,
  EllipsisIcon,
  FolderPlusIcon,
  ImageIcon,
  Loader2Icon,
  PencilIcon,
  SearchIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import { formatFileSize, formatDateShort } from "@/lib/format";
import { useAdminHeaderActions } from "@/components/admin/AdminHeaderContext";
import { t } from "@/config/strings";
import { CreateFolderDialog } from "@/components/admin/media/CreateFolderDialog";
import { RenameFolderDialog } from "@/components/admin/media/RenameFolderDialog";
import { FolderThumbnail } from "@/components/admin/media/FolderThumbnail";
import { DraggableImage } from "@/components/admin/media/DraggableImage";
import type { MediaFolder } from "@/app/api/admin/content/media/folders/route";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

interface MediaItem {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: string;
  displayName: string | null;
  altText: string | null;
  folderId: string | null;
}

function MediaPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentSite, loading: siteLoading } = useSiteContext();
  const { authorized, loading: permissionLoading } = useRequireFeature("media");

  // Read folder from URL params
  const currentFolderId = searchParams.get("folder");
  const currentFolderName = searchParams.get("name");

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Create folder dialog
  const [createFolderOpen, setCreateFolderOpen] = useState(false);

  // Rename folder dialog
  const [renameFolderOpen, setRenameFolderOpen] = useState(false);

  // Delete folder confirmation
  const [deleteFolderOpen, setDeleteFolderOpen] = useState(false);
  const [deletingFolder, setDeletingFolder] = useState(false);

  // Delete image confirmation
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Drag and drop for files
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  // Drag and drop for moving images (dnd-kit)
  const [draggedImage, setDraggedImage] = useState<MediaItem | null>(null);

  // Track items pending alt text generation
  const pendingAltTextUrls = useRef<Set<string>>(new Set());
  const isMountedRef = useRef(true);
  const MAX_POLL_ATTEMPTS = 10;

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (!siteLoading && currentSite) {
      fetchData();
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [currentFolderId, currentSite, siteLoading]);

  // Poll for alt text updates on items that don't have it yet
  const pollForAltText = useCallback(async (urls: string[], attempt = 1) => {
    if (urls.length === 0 || !isMountedRef.current) return;

    const delay = attempt === 1 ? 3000 : 2000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    if (!isMountedRef.current) return;

    for (const url of urls) {
      try {
        const response = await fetch(
          `/api/admin/content/media/${encodeURIComponent(url)}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.altText) {
            setMedia((prev) =>
              prev.map((item) =>
                item.url === url ? { ...item, altText: data.altText } : item
              )
            );
            pendingAltTextUrls.current.delete(url);
          }
        }
      } catch {
        // Silently fail
      }
    }

    const stillPending = urls.filter((url) =>
      pendingAltTextUrls.current.has(url)
    );
    if (
      stillPending.length > 0 &&
      attempt < MAX_POLL_ATTEMPTS &&
      isMountedRef.current
    ) {
      pollForAltText(stillPending, attempt + 1);
    } else if (stillPending.length > 0) {
      stillPending.forEach((url) => pendingAltTextUrls.current.delete(url));
    }
  }, []);

  const fetchData = async () => {
    if (!currentSite) return;
    setLoading(true);
    try {
      // Fetch folders and media in parallel
      const folderParam = currentFolderId ? currentFolderId : "root";
      const [foldersRes, mediaRes] = await Promise.all([
        currentFolderId
          ? Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
          : fetch(`/api/admin/content/media/folders?siteId=${currentSite.id}`),
        fetch(`/api/admin/content/media?folderId=${folderParam}&siteId=${currentSite.id}`),
      ]);

      if (foldersRes.ok && !currentFolderId) {
        const foldersData = await foldersRes.json();
        setFolders(foldersData);
      }

      if (mediaRes.ok) {
        const mediaData = await mediaRes.json();
        setMedia(mediaData);
      }
    } catch {
      toast.error(t("admin.messages.mediaLoadFailed"));
    } finally {
      setLoading(false);
    }
  };

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      if (!currentSite?.id) {
        toast.error("Site niet geladen. Ververs de pagina.");
        return;
      }

      setUploading(true);
      const uploadedItems: MediaItem[] = [];
      let errorCount = 0;

      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          errorCount++;
          continue;
        }

        if (file.size > MAX_FILE_SIZE) {
          errorCount++;
          continue;
        }

        try {
          const blob = await upload(file.name, file, {
            access: "public",
            handleUploadUrl: "/api/admin/content/images/upload",
          });

          // Create metadata with site context (awaited to ensure it completes)
          const metadataResponse = await fetch("/api/admin/content/media/generate-alt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: blob.url,
              fileName: file.name,
              folderId: currentFolderId,
              siteId: currentSite.id,
            }),
          });

          if (!metadataResponse.ok) {
            console.error("Failed to create image metadata:", await metadataResponse.text());
          }

          uploadedItems.push({
            url: blob.url,
            pathname: blob.pathname,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            displayName: file.name,
            altText: null,
            folderId: currentFolderId,
          });
        } catch {
          errorCount++;
        }
      }

      setUploading(false);

      if (uploadedItems.length > 0) {
        setMedia((prev) => [...uploadedItems, ...prev]);
        toast.success(
          `${uploadedItems.length} afbeelding${uploadedItems.length > 1 ? "en" : ""} geupload`
        );

        const newUrls = uploadedItems.map((item) => item.url);
        newUrls.forEach((url) => pendingAltTextUrls.current.add(url));
        pollForAltText(newUrls);

        // Update folder item count if in a folder
        if (currentFolderId) {
          setFolders((prev) =>
            prev.map((f) =>
              f.id === currentFolderId
                ? { ...f, itemCount: f.itemCount + uploadedItems.length }
                : f
            )
          );
        }
      }
      if (errorCount > 0) {
        toast.error(
          `${errorCount} afbeelding${errorCount > 1 ? "en" : ""} mislukt`
        );
      }
    },
    [currentFolderId, currentSite, pollForAltText]
  );

  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      uploadFiles(Array.from(files));
      e.target.value = "";
    },
    [uploadFiles]
  );

  // File drag and drop handlers
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.types.includes("Files")) {
        dragCounter.current++;
        setIsDragging(true);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current--;
      if (dragCounter.current === 0) {
        setIsDragging(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        uploadFiles(Array.from(files));
      }
    };

    document.addEventListener("dragenter", handleDragEnter);
    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("dragleave", handleDragLeave);
    document.addEventListener("drop", handleDrop);

    return () => {
      document.removeEventListener("dragenter", handleDragEnter);
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("dragleave", handleDragLeave);
      document.removeEventListener("drop", handleDrop);
    };
  }, [uploadFiles]);

  // dnd-kit handlers for moving images
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === "image") {
      const image = media.find((m) => m.url === active.data.current?.url);
      setDraggedImage(image || null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedImage(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === "image" && overData?.type === "folder") {
      const imageUrl = activeData.url as string;
      const targetFolderId = overData.folderId as string;

      // Optimistically update UI
      setMedia((prev) => prev.filter((m) => m.url !== imageUrl));
      setFolders((prev) =>
        prev.map((f) =>
          f.id === targetFolderId ? { ...f, itemCount: f.itemCount + 1 } : f
        )
      );

      try {
        const response = await fetch(
          `/api/admin/content/media/${encodeURIComponent(imageUrl)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ folderId: targetFolderId }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to move image");
        }

        // Refetch folder previews
        const foldersRes = await fetch("/api/admin/content/media/folders");
        if (foldersRes.ok) {
          setFolders(await foldersRes.json());
        }

        toast.success(t("admin.messages.imageMoved"));
      } catch {
        // Revert on error
        fetchData();
        toast.error(t("admin.messages.imageMoveFailed"));
      }
    }
  };

  const deleteMedia = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const response = await fetch("/api/admin/content/images/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: deleteTarget.url }),
      });

      const data = await response.json();

      setDeleting(false);
      setDeleteTarget(null);

      if (!response.ok) {
        toast.error(data.error || t("admin.messages.imageDeleteFailed"));
        return;
      }

      setMedia((prev) => prev.filter((m) => m.url !== deleteTarget.url));
      toast.success(t("admin.messages.imageDeleted"));
    } catch (error) {
      console.error("Delete failed:", error);
      setDeleting(false);
      setDeleteTarget(null);
      toast.error(t("admin.messages.imageDeleteFailed"));
    }
  };

  const handleFolderClick = (folder: MediaFolder) => {
    setSearchQuery("");
    router.push(
      `/admin/content/media?folder=${folder.id}&name=${encodeURIComponent(folder.name)}`
    );
  };

  const handleFolderCreated = (folder: { id: string; name: string; siteId?: string | null }) => {
    setFolders((prev) => [
      ...prev,
      {
        id: folder.id,
        name: folder.name,
        createdAt: new Date().toISOString(),
        itemCount: 0,
        previewImages: [],
        siteId: folder.siteId || null,
      },
    ]);
    toast.success(t("admin.messages.folderCreated"));
  };

  const handleFolderRenamed = (newName: string) => {
    // Update URL with new name
    if (currentFolderId) {
      router.replace(
        `/admin/content/media?folder=${currentFolderId}&name=${encodeURIComponent(newName)}`
      );
    }
    toast.success(t("admin.messages.folderRenamed"));
  };

  const handleDeleteFolder = async () => {
    if (!currentFolderId) return;

    setDeletingFolder(true);
    try {
      const response = await fetch(
        `/api/admin/content/media/folders/${currentFolderId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete folder");
      }

      toast.success(t("admin.messages.folderDeleted"));
      router.push("/admin/content/media");
    } catch (error) {
      console.error("Delete folder failed:", error);
      toast.error(t("admin.messages.folderDeleteFailed"));
    } finally {
      setDeletingFolder(false);
      setDeleteFolderOpen(false);
    }
  };

  // Filter media by search query
  const filteredMedia = media.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.pathname.toLowerCase().includes(query) ||
      item.displayName?.toLowerCase().includes(query) ||
      item.altText?.toLowerCase().includes(query)
    );
  });

  // Filter folders by search query (only at root level)
  const filteredFolders = folders.filter((folder) =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Header actions
  const headerActions = useMemo(
    () => (
      <div className="flex items-center gap-2">
        {!currentFolderId && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCreateFolderOpen(true)}
          >
            <FolderPlusIcon className="size-4" />
            {t("admin.headings.newFolder")}
          </Button>
        )}
        <label>
          <Button size="sm" disabled={uploading} asChild>
            <span className="cursor-pointer">
              {uploading ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  {t("admin.loading.uploading")}
                </>
              ) : (
                <>
                  <UploadIcon className="size-4" />
                  {t("admin.buttons.upload")}
                </>
              )}
            </span>
          </Button>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
        {currentFolderId && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <EllipsisIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setRenameFolderOpen(true)}>
                <PencilIcon />
                {t("admin.buttons.edit")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteFolderOpen(true)}
              >
                <Trash2Icon />
                {t("admin.buttons.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    ),
    [uploading, handleUpload, currentFolderId]
  );
  useAdminHeaderActions(headerActions);

  if (permissionLoading || !authorized) {
    return null;
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Search */}
        <div className="relative max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("admin.placeholders.searchFilename")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading || siteLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredFolders.length === 0 && filteredMedia.length === 0 ? (
          <Empty className="border py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ImageIcon className="size-5" />
              </EmptyMedia>
              <EmptyTitle>
                {searchQuery
                  ? t("admin.empty.noResults")
                  : currentFolderId
                    ? t("admin.empty.folderEmpty")
                    : t("admin.misc.noImagesYet")}
              </EmptyTitle>
              {!searchQuery && (
                <EmptyDescription>
                  {currentFolderId
                    ? t("admin.misc.folderEmptyUpload")
                    : t("admin.misc.uploadFirstImage")}
                </EmptyDescription>
              )}
            </EmptyHeader>
            {!searchQuery && (
              <label>
                <Button size="sm" asChild>
                  <span className="cursor-pointer">
                    <UploadIcon className="size-4" />
                    {currentFolderId
                      ? t("admin.misc.addImageToFolder")
                      : t("admin.misc.firstImageUpload")}
                  </span>
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleUpload}
                />
              </label>
            )}
          </Empty>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* Folders first (only at root level) */}
            {!currentFolderId &&
              filteredFolders.map((folder) => (
                <FolderThumbnail
                  key={folder.id}
                  id={folder.id}
                  name={folder.name}
                  itemCount={folder.itemCount}
                  previewImages={folder.previewImages}
                  onClick={() => handleFolderClick(folder)}
                />
              ))}

            {/* Images */}
            {filteredMedia.map((item) => {
              const name = item.displayName || item.pathname;
              return (
                <DraggableImage key={item.url} id={item.url} url={item.url}>
                  <Link
                    href={`/admin/content/media/${encodeURIComponent(item.url)}`}
                    className="group relative aspect-square overflow-hidden rounded-lg shadow-sm transition-all duration-300 ease-in-out hover:scale-103 will-change-transform block"
                  >
                    <Image
                      src={item.url}
                      alt={item.altText || name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                    />
                    {/* Alt text generating indicator */}
                    {!item.altText && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                        <Loader2Icon className="size-3 animate-spin" />
                        <span>{t("admin.misc.altTextLabel")}</span>
                      </div>
                    )}
                    {/* Delete button in top-right corner */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeleteTarget(item);
                        }}
                        title={t("admin.buttons.delete")}
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                    {/* Overlay info at bottom */}
                    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 to-transparent p-3 pt-6">
                      <p
                        className="mb-1! text-xs font-medium text-white truncate"
                        title={name}
                      >
                        {name}
                      </p>
                      <p className="text-xs text-white/80">
                        {formatFileSize(item.size)} •{" "}
                        {formatDateShort(item.uploadedAt)}
                      </p>
                    </div>
                  </Link>
                </DraggableImage>
              );
            })}
          </div>
        )}

        {/* Drag overlay for images being moved */}
        <DragOverlay>
          {draggedImage && (
            <div className="relative aspect-square w-24 overflow-hidden rounded-lg shadow-2xl opacity-80">
              <Image
                src={draggedImage.url}
                alt=""
                fill
                className="object-cover"
              />
            </div>
          )}
        </DragOverlay>

        {/* File drag and drop overlay */}
        {isDragging && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-muted/80 animate-in fade-in duration-150">
            <div className="flex flex-col items-center gap-1 animate-in zoom-in-95 duration-150">
              <CloudUploadIcon className="size-6 animate-pulse" />
              <p className="text-sm text-muted-foreground">
                {t("admin.misc.releaseToUpload")}
                {currentFolderName && ` in "${currentFolderName}"`}...
              </p>
            </div>
          </div>
        )}

        {/* Delete confirmation */}
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={() => setDeleteTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("admin.misc.deleteImageQuestion")}</AlertDialogTitle>
              <AlertDialogDescription>
                Weet je zeker dat je &quot;
                {deleteTarget?.displayName || deleteTarget?.pathname}&quot; wilt
                verwijderen? Dit kan niet ongedaan worden gemaakt.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>
                {t("admin.buttons.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteMedia}
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

        {/* Create folder dialog */}
        <CreateFolderDialog
          open={createFolderOpen}
          onOpenChange={setCreateFolderOpen}
          onCreated={handleFolderCreated}
          siteId={currentSite?.id}
        />

        {/* Rename folder dialog */}
        {currentFolderId && currentFolderName && (
          <RenameFolderDialog
            open={renameFolderOpen}
            onOpenChange={setRenameFolderOpen}
            folderId={currentFolderId}
            currentName={currentFolderName}
            onRenamed={handleFolderRenamed}
          />
        )}

        {/* Delete folder confirmation */}
        <AlertDialog open={deleteFolderOpen} onOpenChange={setDeleteFolderOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("admin.misc.deleteFolderQuestion")}</AlertDialogTitle>
              <AlertDialogDescription>
                Weet je zeker dat je &quot;{currentFolderName}&quot; wilt
                verwijderen? De afbeeldingen in deze map worden niet verwijderd,
                maar verplaatst naar de hoofdmap.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletingFolder}>
                {t("admin.buttons.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteFolder}
                disabled={deletingFolder}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deletingFolder ? (
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
    </DndContext>
  );
}

export default function MediaPage() {
  return (
    <Suspense fallback={null}>
      <MediaPageContent />
    </Suspense>
  );
}
