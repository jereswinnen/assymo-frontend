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
  CalendarDaysIcon,
  GlobeIcon,
  Loader2Icon,
  RefreshCwIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import type { DateOverride } from "@/types/appointments";
import { DAYS_OF_WEEK } from "@/types/appointments";
import { DateOverrideCreateSheet } from "@/app/admin/appointments/sheets/DateOverrideCreateSheet";
import { t } from "@/config/strings";

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
      toast.error(t("admin.messages.overridesLoadFailed"));
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

      toast.success(t("admin.messages.overrideDeleted"));
      loadOverrides();
    } catch (error) {
      console.error("Failed to delete override:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : t("admin.misc.overrideCouldNotDelete"),
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
    // For weekly recurring, show day name
    if (override.recurrence_day_of_week !== null) {
      const day = DAYS_OF_WEEK.find((d) => d.value === override.recurrence_day_of_week);
      return day?.name ?? `Dag ${override.recurrence_day_of_week}`;
    }
    if (override.end_date) {
      // Show range
      return `${formatDateShort(override.date)} - ${formatDateShort(override.end_date)}`;
    }
    return formatDate(override.date, !override.is_recurring);
  };

  const isPast = (override: DateOverride) => {
    // Recurring overrides are never "past"
    if (override.is_recurring) return false;
    // Weekly recurring overrides are never "past"
    if (override.recurrence_day_of_week !== null) return false;

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
          {t("admin.misc.noExceptions")}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming/recurring overrides */}
          {upcomingOverrides.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>{t("admin.labels.date")}</TableHead>
                  <TableHead>{t("admin.labels.status")}</TableHead>
                  <TableHead>{t("admin.labels.reason")}</TableHead>
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
                              {t("admin.misc.visibleOnWebsite")}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span>{formatDateRange(override)}</span>
                        {override.recurrence_day_of_week !== null && (
                          <Badge
                            variant="outline"
                            className="w-fit text-xs gap-1"
                          >
                            <CalendarDaysIcon className="size-3" />
                            {t("admin.misc.weekly")}
                          </Badge>
                        )}
                        {override.is_recurring && (
                          <Badge
                            variant="outline"
                            className="w-fit text-xs gap-1"
                          >
                            <RefreshCwIcon className="size-3" />
                            {t("admin.misc.yearly")}
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
                          ? t("admin.empty.closed")
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
                {t("admin.misc.expired")}
              </h4>
              <Table className="opacity-60">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.labels.date")}</TableHead>
                    <TableHead>{t("admin.labels.status")}</TableHead>
                    <TableHead>{t("admin.labels.reason")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastOverrides.slice(0, 5).map((override) => (
                    <TableRow key={override.id}>
                      <TableCell>{formatDateRange(override)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {override.is_closed ? t("admin.empty.closed") : t("admin.misc.customHours")}
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

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.misc.deleteOverrideQuestion")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.dialogs.confirmDelete")} {t("admin.dialogs.cannotUndo")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting !== null}>
              {t("admin.buttons.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={deleting !== null}
            >
              {deleting !== null && (
                <Loader2Icon className="size-4 animate-spin" />
              )}
              {t("admin.buttons.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
