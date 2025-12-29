"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FieldDescription,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { toast } from "sonner";
import {
  MonitorSmartphoneIcon,
  Loader2Icon,
  LogOutIcon,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";

interface Session {
  id: string;
  token: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export function SessionsSection() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionToken, setCurrentSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokeAllDialogOpen, setRevokeAllDialogOpen] = useState(false);
  const [revokingAll, setRevokingAll] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      // Get current session to identify it
      const { data: sessionData } = await authClient.getSession();
      if (sessionData?.session) {
        setCurrentSessionToken(sessionData.session.token);
      }

      // List all sessions
      const { data } = await authClient.listSessions();
      if (data) {
        setSessions(data);
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (token: string) => {
    setRevokingId(token);
    try {
      const { error } = await authClient.revokeSession({ token });
      if (error) {
        toast.error("Kon sessie niet beëindigen");
        return;
      }
      toast.success("Sessie beëindigd");
      setSessions((prev) => prev.filter((s) => s.token !== token));
    } catch (err) {
      console.error("Failed to revoke session:", err);
      toast.error("Er is een fout opgetreden");
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAllOther = async () => {
    setRevokingAll(true);
    try {
      const { error } = await authClient.revokeOtherSessions();
      if (error) {
        toast.error("Kon sessies niet beëindigen");
        return;
      }
      toast.success("Alle andere sessies beëindigd");
      // Keep only current session
      setSessions((prev) => prev.filter((s) => s.token === currentSessionToken));
      setRevokeAllDialogOpen(false);
    } catch (err) {
      console.error("Failed to revoke sessions:", err);
      toast.error("Er is een fout opgetreden");
    } finally {
      setRevokingAll(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const parseUserAgent = (userAgent?: string | null) => {
    if (!userAgent) return "Onbekend apparaat";

    // Simple browser detection
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";

    return "Browser";
  };

  if (loading) {
    return (
      <FieldSet>
        <FieldLegend className="flex items-center gap-1.5 font-semibold">
          <MonitorSmartphoneIcon className="size-4 opacity-80" />
          Actieve sessies
        </FieldLegend>
        <div className="flex items-center justify-center py-4">
          <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
        </div>
      </FieldSet>
    );
  }

  const otherSessions = sessions.filter((s) => s.token !== currentSessionToken);

  return (
    <>
      <FieldSet>
        <FieldLegend className="flex items-center gap-1.5 font-semibold">
          <MonitorSmartphoneIcon className="size-4 opacity-80" />
          Actieve sessies
        </FieldLegend>
        <FieldDescription>
          Beheer apparaten waar je bent ingelogd.
        </FieldDescription>

        <div className="space-y-4">
          {sessions.length > 0 ? (
            <div className="p-3 space-y-4 border border-border rounded-lg">
              {sessions.map((session) => {
                const isCurrent = session.token === currentSessionToken;
                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <MonitorSmartphoneIcon className="size-5 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {parseUserAgent(session.userAgent)}
                          </p>
                          {isCurrent && (
                            <Badge variant="secondary" className="text-xs">
                              Huidige sessie
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {session.ipAddress || "Onbekend IP"} · Laatst actief {formatDate(session.updatedAt)}
                        </p>
                      </div>
                    </div>
                    {!isCurrent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevokeSession(session.token)}
                        disabled={revokingId === session.token}
                      >
                        {revokingId === session.token ? (
                          <Loader2Icon className="size-4 animate-spin" />
                        ) : (
                          <LogOutIcon className="size-4" />
                        )}
                        Beëindigen
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Geen actieve sessies gevonden
            </p>
          )}

          {otherSessions.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRevokeAllDialogOpen(true)}
              className="w-fit"
            >
              <LogOutIcon className="size-4" />
              Alle andere sessies beëindigen
            </Button>
          )}
        </div>
      </FieldSet>

      <Dialog open={revokeAllDialogOpen} onOpenChange={setRevokeAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alle andere sessies beëindigen</DialogTitle>
            <DialogDescription>
              Dit logt je uit op alle andere apparaten. Je huidige sessie blijft actief.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevokeAllDialogOpen(false)}
              disabled={revokingAll}
            >
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevokeAllOther}
              disabled={revokingAll}
            >
              {revokingAll ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                "Beëindigen"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
