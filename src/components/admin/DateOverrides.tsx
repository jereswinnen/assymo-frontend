"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CalendarOffIcon,
  ClockPlusIcon,
  Loader2Icon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import type { DateOverride } from "@/types/appointments";

export function DateOverrides() {
  const [overrides, setOverrides] = useState<DateOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    date: "",
    is_closed: true,
    open_time: "10:00",
    close_time: "17:00",
    reason: "",
  });

  useEffect(() => {
    loadOverrides();
  }, []);

  const loadOverrides = async () => {
    try {
      const response = await fetch("/api/admin/appointments/overrides");
      if (!response.ok) throw new Error("Failed to load overrides");

      const data = await response.json();
      setOverrides(data.overrides || []);
    } catch (error) {
      console.error("Failed to load overrides:", error);
      toast.error("Kon overrides niet laden");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.date) {
      toast.error("Selecteer een datum");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/appointments/overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formData.date,
          is_closed: formData.is_closed,
          open_time: formData.is_closed ? null : formData.open_time,
          close_time: formData.is_closed ? null : formData.close_time,
          reason: formData.reason || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create");
      }

      toast.success("Override toegevoegd");
      setDialogOpen(false);
      resetForm();
      loadOverrides();
    } catch (error) {
      console.error("Failed to create override:", error);
      toast.error(
        error instanceof Error ? error.message : "Kon override niet toevoegen",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      const response = await fetch(
        `/api/admin/appointments/overrides?id=${id}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete");
      }

      toast.success("Override verwijderd");
      loadOverrides();
    } catch (error) {
      console.error("Failed to delete override:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Kon override niet verwijderen",
      );
    } finally {
      setDeleting(null);
      setDeleteConfirmId(null);
    }
  };

  const confirmDelete = (id: number) => {
    setDeleteConfirmId(id);
  };

  const resetForm = () => {
    setFormData({
      date: "",
      is_closed: true,
      open_time: "10:00",
      close_time: "17:00",
      reason: "",
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const isPast = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateStr) < today;
  };

  // Separate into upcoming and past
  const upcomingOverrides = overrides.filter((o) => !isPast(o.date));
  const pastOverrides = overrides.filter((o) => isPast(o.date));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Uitzonderingen</h3>
          <p className="text-sm text-muted-foreground">
            Sluit specifieke dagen of stel afwijkende openingsuren in.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <ClockPlusIcon className="size-4" />
          Toevoegen
        </Button>
      </div>

      {overrides.length === 0 ? (
        <div className="text-muted-foreground text-center text-sm py-8">
          Geen geblokkeerde data
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming overrides */}
          {upcomingOverrides.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Aankomend
              </h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reden</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingOverrides.map((override) => (
                    <TableRow key={override.id}>
                      <TableCell>{formatDate(override.date)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            override.is_closed ? "destructive" : "secondary"
                          }
                        >
                          {override.is_closed
                            ? "Gesloten"
                            : `${override.open_time?.substring(0, 5)} - ${override.close_time?.substring(0, 5)}`}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {override.reason || "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => confirmDelete(override.id)}
                          disabled={deleting === override.id}
                        >
                          {deleting === override.id ? (
                            <Loader2Icon className="size-4 animate-spin" />
                          ) : (
                            <Trash2Icon className="size-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Past overrides */}
          {pastOverrides.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Verlopen
              </h4>
              <Table className="opacity-60">
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reden</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastOverrides.slice(0, 5).map((override) => (
                    <TableRow key={override.id}>
                      <TableCell>{formatDate(override.date)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {override.is_closed ? "Gesloten" : "Aangepast"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {override.reason || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarOffIcon className="size-4" />
              Uitzondering toevoegen
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Datum</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                min={new Date().toISOString().split("T")[0]}
                className="[&::-webkit-calendar-picker-indicator]:hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="is_closed"
                checked={formData.is_closed}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_closed: !!checked })
                }
              />
              <Label htmlFor="is_closed">Volledig gesloten</Label>
            </div>

            {!formData.is_closed && (
              <div className="flex gap-4">
                <div className="space-y-2 flex-1">
                  <Label>Van</Label>
                  <Input
                    type="time"
                    value={formData.open_time}
                    onChange={(e) =>
                      setFormData({ ...formData, open_time: e.target.value })
                    }
                    className="[&::-webkit-calendar-picker-indicator]:hidden"
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <Label>Tot</Label>
                  <Input
                    type="time"
                    value={formData.close_time}
                    onChange={(e) =>
                      setFormData({ ...formData, close_time: e.target.value })
                    }
                    className="[&::-webkit-calendar-picker-indicator]:hidden"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Reden (optioneel)</Label>
              <Input
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder="bijv. Feestdag, Vakantie..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2Icon className="size-4 animate-spin" />}
              Toevoegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2Icon className="size-4" />
              Uitzondering verwijderen
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Weet je zeker dat je deze uitzondering wilt verwijderen? Dit kan
            niet ongedaan worden gemaakt.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={deleting !== null}
            >
              {deleting !== null && (
                <Loader2Icon className="size-4 animate-spin" />
              )}
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
