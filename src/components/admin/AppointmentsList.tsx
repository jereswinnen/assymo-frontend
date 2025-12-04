"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Item,
  ItemGroup,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemMedia,
} from "@/components/ui/item";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarIcon,
  CalendarPlusIcon,
  Loader2Icon,
  PlusIcon,
  SearchIcon,
  UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { AppointmentDialog } from "./AppointmentDialog";
import { CreateAppointmentForm } from "./CreateAppointmentForm";
import type { Appointment, AppointmentStatus } from "@/types/appointments";
import { STATUS_LABELS } from "@/types/appointments";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "../ui/input-group";

export function AppointmentsList() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">(
    "all",
  );
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

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
    setCreateDialogOpen(false);
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
      {/* Header with actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 max-w-xl gap-4">
          <div className="flex flex-1 gap-2">
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
        </div>

        <Button onClick={() => setCreateDialogOpen(true)}>
          <CalendarPlusIcon className="size-4" />
          Nieuwe afspraak
        </Button>
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
        <ItemGroup className="space-y-1">
          {sortedAppointments.map((appointment) => (
            <Item
              key={appointment.id}
              variant="outline"
              size="sm"
              className="cursor-pointer hover:bg-accent/50"
              onClick={() => handleAppointmentClick(appointment)}
            >
              <ItemMedia variant="icon">
                <UserIcon className="size-4" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle className="flex items-center gap-2">
                  {appointment.customer_name}
                  <Badge variant={getStatusBadgeVariant(appointment.status)}>
                    {STATUS_LABELS[appointment.status]}
                  </Badge>
                </ItemTitle>
                <ItemDescription className="flex items-center gap-2">
                  <CalendarIcon className="size-3" />
                  {formatDate(appointment.appointment_date)} om{" "}
                  {formatTime(appointment.appointment_time)}
                  <span className="text-muted-foreground">•</span>
                  {appointment.customer_email}
                </ItemDescription>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      )}

      {/* View/Edit Dialog */}
      <AppointmentDialog
        appointment={selectedAppointment}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdate={handleAppointmentUpdated}
      />

      {/* Create Dialog */}
      <CreateAppointmentForm
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={handleAppointmentCreated}
      />
    </div>
  );
}
