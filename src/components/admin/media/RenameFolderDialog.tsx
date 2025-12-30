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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2Icon } from "lucide-react";
import { t } from "@/config/strings";

interface RenameFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string;
  currentName: string;
  onRenamed: (newName: string) => void;
}

export function RenameFolderDialog({
  open,
  onOpenChange,
  folderId,
  currentName,
  onRenamed,
}: RenameFolderDialogProps) {
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(currentName);
      setError(null);
    }
  }, [open, currentName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError(t("admin.messages.nameRequired"));
      return;
    }

    if (name.trim() === currentName) {
      onOpenChange(false);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/content/media/folders/${folderId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t("admin.messages.somethingWentWrongShort"));
        setSaving(false);
        return;
      }

      onRenamed(data.name);
      onOpenChange(false);
    } catch {
      setError(t("admin.messages.somethingWentWrongShort"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("admin.headings.renameFolder")}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="folder-name">{t("admin.labels.name")}</Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder={t("admin.placeholders.folderName")}
              autoFocus
              className="mt-2"
            />
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              {t("admin.buttons.cancel")}
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  {t("admin.buttons.saving")}
                </>
              ) : (
                t("admin.buttons.save")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
