"use client";

import { useEffect, useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, ListIcon, Loader2Icon, SearchIcon } from "lucide-react";
import { toast } from "sonner";
import { AppointmentEditSheet } from "@/app/(admin)/admin/appointments/sheets/AppointmentEditSheet";
import { AppointmentCreateSheet } from "@/app/(admin)/admin/appointments/sheets/AppointmentCreateSheet";
import { AdminAppointmentsCalendar } from "./AdminAppointmentsCalendar";
import type { Appointment, AppointmentStatus } from "@/types/appointments";
import { STATUS_LABELS } from "@/types/appointments";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "../../ui/input-group";
import { t } from "@/config/strings";

interface AppointmentsListProps {
  createDialogOpen: boolean;
  onCreateDialogOpenChange: (open: boolean) => void;
}

export function AppointmentsList({
  createDialogOpen,
  onCreateDialogOpenChange,
}: AppointmentsListProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">(
    "all",
  );
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<
    Date | undefined
  >();

  useEffect(() => {
    loadAppointments();
  }, [statusFilter]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      const response = await fetch(`/api/admin/appointments?${params}`);
      if (!response.ok) throw new Error("Failed to load appointments");

      const data = await response.json();
      setAppointments(data.appointments || []);
    } catch (error) {
      console.error("Failed to load appointments:", error);
      toast.error(t("admin.messages.appointmentsLoadFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadAppointments();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/appointments?search=${encodeURIComponent(searchQuery)}`,
      );
      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      setAppointments(data.appointments || []);
    } catch (error) {
      console.error("Search failed:", error);
      toast.error(t("admin.messages.searchFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDialogOpen(true);
  };

  const handleAppointmentUpdated = () => {
    loadAppointments();
  };

  const handleAppointmentCreated = () => {
    onCreateDialogOpenChange(false);
    setCalendarSelectedDate(undefined);
    loadAppointments();
  };

  const handleCalendarDateClick = (date: Date) => {
    setCalendarSelectedDate(date);
    onCreateDialogOpenChange(true);
  };

  const handleCreateSheetOpenChange = (open: boolean) => {
    if (!open) {
      setCalendarSelectedDate(undefined);
    }
    onCreateDialogOpenChange(open);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("nl-NL", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5);
  };

  const getStatusBadgeVariant = (status: AppointmentStatus) => {
    switch (status) {
      case "confirmed":
        return "default";
      case "cancelled":
        return "destructive";
      case "completed":
        return "secondary";
      default:
        return "outline";
    }
  };

  // Filter by date - upcoming first, then past
  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`);
    const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="space-y-4">
      {/* Search, filter, and view toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 max-w-xl gap-2">
          <InputGroup className="flex flex-1">
            <InputGroupInput
              placeholder={t("admin.placeholders.searchAppointments")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                onClick={handleSearch}
                type="submit"
                variant="default"
                disabled={!searchQuery.trim()}
              >
                Zoeken
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as AppointmentStatus | "all")
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t("admin.placeholders.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="confirmed">Bevestigd</SelectItem>
              <SelectItem value="cancelled">Geannuleerd</SelectItem>
              <SelectItem value="completed">Afgerond</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View toggle */}
        <Tabs
          value={viewMode}
          onValueChange={(value) => setViewMode(value as "calendar" | "list")}
        >
          <TabsList>
            <TabsTrigger value="calendar">
              <CalendarIcon className="size-4" />
              {t("admin.headings.calendar")}
            </TabsTrigger>
            <TabsTrigger value="list">
              <ListIcon className="size-4" />
              {t("admin.headings.list")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Calendar view */}
      {viewMode === "calendar" && (
        <AdminAppointmentsCalendar
          appointments={appointments}
          onDateClick={handleCalendarDateClick}
          loading={loading}
        />
      )}

      {/* List view */}
      {viewMode === "list" && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : sortedAppointments.length === 0 ? (
            <div className="text-muted-foreground text-center text-sm py-8">
              Geen afspraken gevonden
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Klant</TableHead>
                  <TableHead>Datum & tijd</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAppointments.map((appointment) => (
                  <TableRow
                    key={appointment.id}
                    className="cursor-pointer"
                    onClick={() => handleAppointmentClick(appointment)}
                  >
                    <TableCell>
                      <div className="font-medium">
                        {appointment.customer_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {appointment.customer_email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(appointment.appointment_date)} om{" "}
                      {formatTime(appointment.appointment_time)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(appointment.status)}>
                        {STATUS_LABELS[appointment.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}

      {/* View/Edit Sheet */}
      <AppointmentEditSheet
        appointment={selectedAppointment}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdate={handleAppointmentUpdated}
      />

      {/* Create Sheet */}
      <AppointmentCreateSheet
        open={createDialogOpen}
        onOpenChange={handleCreateSheetOpenChange}
        onCreated={handleAppointmentCreated}
        initialDate={calendarSelectedDate}
      />
    </div>
  );
}
