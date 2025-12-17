"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2Icon,
  ShieldCheckIcon,
  FingerprintIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Separator } from "../ui/separator";

interface Passkey {
  id: string;
  name?: string;
  createdAt: Date;
}

export function SecuritySettings() {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passkeyToDelete, setPasskeyToDelete] = useState<Passkey | null>(null);

  const loadPasskeys = async () => {
    try {
      const { data } = await authClient.passkey.listUserPasskeys();
      if (data) {
        setPasskeys(data);
      }
    } catch (err) {
      console.error("Failed to load passkeys:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPasskeys();
  }, []);

  const handleAddPasskey = async () => {
    setAdding(true);
    try {
      const { error } = await authClient.passkey.addPasskey();
      if (error) {
        if (!error.message?.toLowerCase().includes("cancel")) {
          toast.error("Kon passkey niet toevoegen");
        }
        return;
      }
      toast.success("Passkey toegevoegd");
      loadPasskeys();
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        toast.error("Kon passkey niet toevoegen");
      }
    } finally {
      setAdding(false);
    }
  };

  const openDeleteDialog = (passkey: Passkey) => {
    setPasskeyToDelete(passkey);
    setDeleteDialogOpen(true);
  };

  const handleDeletePasskey = async () => {
    if (!passkeyToDelete) return;

    setDeletingId(passkeyToDelete.id);
    try {
      const { error } = await authClient.passkey.deletePasskey({
        id: passkeyToDelete.id,
      });
      if (error) {
        toast.error("Kon passkey niet verwijderen");
        return;
      }
      toast.success("Passkey verwijderd");
      setPasskeys((prev) => prev.filter((p) => p.id !== passkeyToDelete.id));
      setDeleteDialogOpen(false);
      setPasskeyToDelete(null);
    } catch (err) {
      console.error("Failed to delete passkey:", err);
      toast.error("Kon passkey niet verwijderen");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* 2FA Status */}
      <div className="space-y-4">
        <header className="space-y-2">
          <h3 className="mb-1! font-medium flex items-center gap-1.5">
            <ShieldCheckIcon className="size-5" />
            Tweestapsverificatie
          </h3>
          <p className="text-sm text-muted-foreground">
            2FA is ingeschakeld voor je account. Dit is verplicht voor alle
            admin gebruikers.
          </p>
        </header>
      </div>

      <Separator />

      {/* Passkeys */}
      <div className="space-y-4">
        <header className="space-y-2">
          <h3 className="mb-1! font-medium flex items-center gap-1.5">
            <FingerprintIcon className="size-5" />
            Passkeys
          </h3>
          <p className="text-sm text-muted-foreground">
            Log sneller in met FaceID, TouchID of de toegangscode van je
            toestel.
          </p>
        </header>

        {passkeys.length > 0 ? (
          <div className="p-3 space-y-4 border border-border rounded-lg">
            {passkeys.map((passkey) => (
              <div
                key={passkey.id}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="mb-0! text-base font-medium">
                    {passkey.name || "Passkey"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Toegevoegd op {formatDate(passkey.createdAt)}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => openDeleteDialog(passkey)}
                  disabled={deletingId === passkey.id}
                >
                  <Trash2Icon className="size-4" /> Verwijderen
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Geen passkeys geregistreerd
          </p>
        )}

        <Button
          variant="secondary"
          onClick={handleAddPasskey}
          disabled={adding}
          className="w-full"
        >
          {adding ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <PlusIcon className="size-4" />
          )}
          Passkey toevoegen
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Passkey verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je deze passkey wilt verwijderen? Je kunt dan
              niet meer inloggen met deze passkey.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={!!deletingId}
            >
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePasskey}
              disabled={!!deletingId}
            >
              {deletingId ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                "Verwijderen"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
