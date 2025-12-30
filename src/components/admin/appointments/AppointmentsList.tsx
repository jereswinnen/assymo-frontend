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
import { Loader2Icon, SearchIcon } from "lucide-react";
import { toast } from "sonner";
import { AppointmentEditSheet } from "@/app/admin/appointments/sheets/AppointmentEditSheet";
import { AppointmentCreateSheet } from "@/app/admin/appointments/sheets/AppointmentCreateSheet";
import type { Appointment, AppointmentStatus } from "@/types/appointments";
import { STATUS_LABELS } from "@/types/appointments";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "../../ui/input-group";

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
      toast.error("Kon afspraken niet laden");
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
      toast.error("Zoeken mislukt");
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
    loadAppointments();
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
      {/* Search and filter */}
      <div className="flex flex-1 max-w-xl gap-2">
        <InputGroup className="flex flex-1">
          <InputGroupInput
            placeholder="Zoek op naam, email of telefoon..."
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
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="confirmed">Bevestigd</SelectItem>
            <SelectItem value="cancelled">Geannuleerd</SelectItem>
            <SelectItem value="completed">Afgerond</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Appointments list */}
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
                  <div className="font-medium">{appointment.customer_name}</div>
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
        onOpenChange={onCreateDialogOpenChange}
        onCreated={handleAppointmentCreated}
      />
    </div>
  );
}
