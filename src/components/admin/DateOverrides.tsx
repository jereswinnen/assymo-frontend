"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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
  GlobeIcon,
  Loader2Icon,
  RefreshCwIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import type { DateOverride } from "@/types/appointments";

interface DateOverridesProps {
  createDialogOpen: boolean;
  onCreateDialogOpenChange: (open: boolean) => void;
}

export function DateOverrides({
  createDialogOpen,
  onCreateDialogOpenChange,
}: DateOverridesProps) {
  const [overrides, setOverrides] = useState<DateOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    date: "",
    end_date: "",
    is_closed: true,
    open_time: "10:00",
    close_time: "17:00",
    reason: "",
    is_recurring: false,
    show_on_website: false,
    hasDateRange: false,
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

    if (formData.hasDateRange && !formData.end_date) {
      toast.error("Selecteer een einddatum");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/appointments/overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formData.date,
          end_date: formData.hasDateRange ? formData.end_date : null,
          is_closed: formData.is_closed,
          open_time: formData.is_closed ? null : formData.open_time,
          close_time: formData.is_closed ? null : formData.close_time,
          reason: formData.reason || undefined,
          is_recurring: formData.is_recurring,
          show_on_website: formData.show_on_website,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create");
      }

      toast.success("Uitzondering toegevoegd");
      onCreateDialogOpenChange(false);
      resetForm();
      loadOverrides();
    } catch (error) {
      console.error("Failed to create override:", error);
      toast.error(
        error instanceof Error ? error.message : "Kon uitzondering niet toevoegen"
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
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete");
      }

      toast.success("Uitzondering verwijderd");
      loadOverrides();
    } catch (error) {
      console.error("Failed to delete override:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Kon uitzondering niet verwijderen"
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
      end_date: "",
      is_closed: true,
      open_time: "10:00",
      close_time: "17:00",
      reason: "",
      is_recurring: false,
      show_on_website: false,
      hasDateRange: false,
    });
  };

  // Reset form when dialog opens
  useEffect(() => {
    if (createDialogOpen) {
      resetForm();
    }
  }, [createDialogOpen]);

  const formatDate = (dateStr: string, includeYear = true) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
    };
    if (includeYear) {
      options.year = "numeric";
    }
    return new Date(dateStr).toLocaleDateString("nl-NL", options);
  };

  const formatDateShort = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
    });
  };

  const formatDateRange = (override: DateOverride) => {
    if (override.end_date) {
      // Show range
      return `${formatDateShort(override.date)} - ${formatDateShort(override.end_date)}`;
    }
    return formatDate(override.date, !override.is_recurring);
  };

  const isPast = (override: DateOverride) => {
    // Recurring overrides are never "past"
    if (override.is_recurring) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // For ranges, check if end_date is past
    const checkDate = override.end_date || override.date;
    return new Date(checkDate) < today;
  };

  // Separate into upcoming/recurring and past
  const upcomingOverrides = overrides.filter((o) => !isPast(o));
  const pastOverrides = overrides.filter((o) => isPast(o));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Sluit specifieke dagen of stel afwijkende openingsuren in.
      </p>

      {overrides.length === 0 ? (
        <div className="text-muted-foreground text-center text-sm py-8">
          Geen uitzonderingen
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming/recurring overrides */}
          {upcomingOverrides.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Actief & Aankomend
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
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span>{formatDateRange(override)}</span>
                          <div className="flex gap-1">
                            {override.is_recurring && (
                              <Badge
                                variant="outline"
                                className="text-xs gap-1"
                              >
                                <RefreshCwIcon className="size-3" />
                                Jaarlijks
                              </Badge>
                            )}
                            {override.show_on_website && (
                              <Badge
                                variant="outline"
                                className="text-xs gap-1 border-green-500 text-green-600"
                              >
                                <GlobeIcon className="size-3" />
                                Website
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
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
                      <TableCell>{formatDateRange(override)}</TableCell>
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
      <Dialog open={createDialogOpen} onOpenChange={onCreateDialogOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarOffIcon className="size-4" />
              Uitzondering toevoegen
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Date selection */}
            <div className="space-y-2">
              <Label>{formData.hasDateRange ? "Begindatum" : "Datum"}</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                min={
                  formData.is_recurring
                    ? undefined
                    : new Date().toISOString().split("T")[0]
                }
                className="[&::-webkit-calendar-picker-indicator]:hidden"
              />
            </div>

            {/* Date range toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="hasDateRange">Meerdere dagen</Label>
                <p className="text-xs text-muted-foreground">
                  Sluiting voor een periode
                </p>
              </div>
              <Switch
                id="hasDateRange"
                checked={formData.hasDateRange}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, hasDateRange: checked, end_date: "" })
                }
              />
            </div>

            {/* End date (conditional) */}
            {formData.hasDateRange && (
              <div className="space-y-2">
                <Label>Einddatum</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                  min={formData.date || new Date().toISOString().split("T")[0]}
                  className="[&::-webkit-calendar-picker-indicator]:hidden"
                />
              </div>
            )}

            {/* Closed toggle */}
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

            {/* Custom hours (conditional) */}
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

            {/* Reason */}
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

            {/* Divider */}
            <div className="border-t pt-4 space-y-4">
              {/* Recurring toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_recurring" className="flex items-center gap-2">
                    <RefreshCwIcon className="size-4" />
                    Jaarlijks herhalen
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Deze uitzondering herhaalt elk jaar
                  </p>
                </div>
                <Switch
                  id="is_recurring"
                  checked={formData.is_recurring}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_recurring: checked })
                  }
                />
              </div>

              {/* Show on website toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="show_on_website"
                    className="flex items-center gap-2"
                  >
                    <GlobeIcon className="size-4" />
                    Toon op website
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Bezoekers zien dat we gesloten zijn
                  </p>
                </div>
                <Switch
                  id="show_on_website"
                  checked={formData.show_on_website}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, show_on_website: checked })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onCreateDialogOpenChange(false)}
            >
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
