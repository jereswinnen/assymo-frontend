"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
  GlobeIcon,
  Loader2Icon,
  RefreshCwIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import type { DateOverride } from "@/types/appointments";
import { DateOverrideCreateSheet } from "@/app/admin/appointments/sheets/DateOverrideCreateSheet";

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
  const [deleting, setDeleting] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

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
      <DateOverrideCreateSheet
        open={createDialogOpen}
        onOpenChange={onCreateDialogOpenChange}
        onCreated={loadOverrides}
      />

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
