"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldSeparator,
} from "@/components/ui/field";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  CalendarOffIcon,
  CheckIcon,
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
        error instanceof Error
          ? error.message
          : "Kon uitzondering niet toevoegen",
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

      toast.success("Uitzondering verwijderd");
      loadOverrides();
    } catch (error) {
      console.error("Failed to delete override:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Kon uitzondering niet verwijderen",
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
      {overrides.length === 0 ? (
        <div className="text-muted-foreground text-center text-sm py-8">
          Geen uitzonderingen
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming/recurring overrides */}
          {upcomingOverrides.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reden</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingOverrides.map((override) => (
                  <TableRow key={override.id} className="group">
                    <TableCell>
                      <div className="flex items-center justify-center">
                        {override.show_on_website && (
                          <Tooltip>
                            <TooltipTrigger>
                              <GlobeIcon className="size-4 opacity-80" />
                            </TooltipTrigger>
                            <TooltipContent>
                              Zichtbaar op website
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span>{formatDateRange(override)}</span>
                        {override.is_recurring && (
                          <Badge
                            variant="outline"
                            className="w-fit text-xs gap-1"
                          >
                            <RefreshCwIcon className="size-3" />
                            Jaarlijks
                          </Badge>
                        )}
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
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
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

      {/* Create Sheet */}
      <Sheet open={createDialogOpen} onOpenChange={onCreateDialogOpenChange}>
        <SheetContent className="flex flex-col overflow-hidden sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Uitzondering toevoegen</SheetTitle>
            <SheetDescription>
              Sluit de zaak op een specifieke datum of wijzig de openingstijden.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4">
            <FieldGroup>
              {/* Date selection */}
              <Field>
                <FieldLabel>
                  {formData.hasDateRange ? "Begindatum" : "Datum"}
                </FieldLabel>
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
              </Field>

              {/* Date range toggle */}
              <Field orientation="horizontal">
                <FieldLabel htmlFor="hasDateRange">Meerdere dagen</FieldLabel>
                <Switch
                  id="hasDateRange"
                  checked={formData.hasDateRange}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      hasDateRange: checked,
                      end_date: "",
                    })
                  }
                />
              </Field>

              {/* End date (conditional) */}
              {formData.hasDateRange && (
                <Field>
                  <FieldLabel>Einddatum</FieldLabel>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    min={
                      formData.date || new Date().toISOString().split("T")[0]
                    }
                    className="[&::-webkit-calendar-picker-indicator]:hidden"
                  />
                </Field>
              )}

              {/* Closed toggle */}
              <Field orientation="horizontal">
                <Checkbox
                  id="is_closed"
                  checked={formData.is_closed}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_closed: !!checked })
                  }
                />
                <FieldLabel htmlFor="is_closed">Volledig gesloten</FieldLabel>
              </Field>

              {/* Custom hours (conditional) */}
              {!formData.is_closed && (
                <div className="flex gap-4">
                  <Field className="flex-1">
                    <FieldLabel>Van</FieldLabel>
                    <Input
                      type="time"
                      value={formData.open_time}
                      onChange={(e) =>
                        setFormData({ ...formData, open_time: e.target.value })
                      }
                      className="[&::-webkit-calendar-picker-indicator]:hidden"
                    />
                  </Field>
                  <Field className="flex-1">
                    <FieldLabel>Tot</FieldLabel>
                    <Input
                      type="time"
                      value={formData.close_time}
                      onChange={(e) =>
                        setFormData({ ...formData, close_time: e.target.value })
                      }
                      className="[&::-webkit-calendar-picker-indicator]:hidden"
                    />
                  </Field>
                </div>
              )}

              {/* Reason */}
              <Field>
                <FieldLabel>Reden (optioneel)</FieldLabel>
                <Input
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder="bijv. Feestdag, Vakantie..."
                />
              </Field>

              <FieldSeparator />

              {/* Recurring toggle */}
              <Field orientation="horizontal">
                <FieldLabel htmlFor="is_recurring">
                  <RefreshCwIcon className="size-4" />
                  Jaarlijks herhalen
                </FieldLabel>
                <Switch
                  id="is_recurring"
                  checked={formData.is_recurring}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_recurring: checked })
                  }
                />
              </Field>

              {/* Show on website toggle */}
              <Field orientation="horizontal">
                <FieldLabel htmlFor="show_on_website">
                  <GlobeIcon className="size-4" />
                  Toon op website
                </FieldLabel>
                <Switch
                  id="show_on_website"
                  checked={formData.show_on_website}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, show_on_website: checked })
                  }
                />
              </Field>
            </FieldGroup>
          </div>

          <SheetFooter>
            <Button onClick={handleCreate} disabled={saving || !formData.date}>
              {saving ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <CheckIcon className="size-4" />
              )}
              Opslaan
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

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
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
            >
              Annuleren
            </Button>
            <Button
              size="sm"
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
