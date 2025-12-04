"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Item,
  ItemGroup,
  ItemContent,
  ItemTitle,
  ItemDescription,
} from "@/components/ui/item";
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
  TrashIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { DateOverride } from "@/types/appointments";

export function DateOverrides() {
  const [overrides, setOverrides] = useState<DateOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

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
    if (!confirm("Weet je zeker dat je deze override wilt verwijderen?")) {
      return;
    }

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
    }
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
              <ItemGroup className="space-y-1">
                {upcomingOverrides.map((override) => (
                  <Item
                    key={override.id}
                    variant="outline"
                    size="sm"
                    className="group"
                  >
                    <ItemContent>
                      <ItemTitle className="flex items-center gap-2">
                        {formatDate(override.date)}
                        <Badge
                          variant={
                            override.is_closed ? "destructive" : "secondary"
                          }
                        >
                          {override.is_closed
                            ? "Gesloten"
                            : `${override.open_time?.substring(0, 5)} - ${override.close_time?.substring(0, 5)}`}
                        </Badge>
                      </ItemTitle>
                      {override.reason && (
                        <ItemDescription>{override.reason}</ItemDescription>
                      )}
                    </ItemContent>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100"
                      onClick={() => handleDelete(override.id)}
                      disabled={deleting === override.id}
                    >
                      {deleting === override.id ? (
                        <Loader2Icon className="size-4 animate-spin" />
                      ) : (
                        <TrashIcon className="size-4" />
                      )}
                    </Button>
                  </Item>
                ))}
              </ItemGroup>
            </div>
          )}

          {/* Past overrides */}
          {pastOverrides.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Verlopen
              </h4>
              <ItemGroup className="space-y-1 opacity-60">
                {pastOverrides.slice(0, 5).map((override) => (
                  <Item key={override.id} variant="outline" size="sm">
                    <ItemContent>
                      <ItemTitle className="flex items-center gap-2">
                        {formatDate(override.date)}
                        <Badge variant="outline">
                          {override.is_closed ? "Gesloten" : "Aangepast"}
                        </Badge>
                      </ItemTitle>
                      {override.reason && (
                        <ItemDescription>{override.reason}</ItemDescription>
                      )}
                    </ItemContent>
                  </Item>
                ))}
              </ItemGroup>
            </div>
          )}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarOffIcon className="size-5" />
              Datum blokkeren
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
    </div>
  );
}
