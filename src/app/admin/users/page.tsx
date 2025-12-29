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
import { Loader2Icon, ShieldCheckIcon, UserIcon } from "lucide-react";
import { toast } from "sonner";
import { UserEditDialog } from "@/components/admin/UserEditDialog";
import type { Role, FeatureOverrides } from "@/lib/permissions/types";

interface Site {
  id: string;
  name: string;
  slug: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  feature_overrides: FeatureOverrides | null;
  created_at: string;
  two_factor_enabled: boolean;
  sites: Site[];
}

const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  content_editor: "Content Editor",
};

const ROLE_VARIANTS: Record<Role, "default" | "secondary" | "outline"> = {
  super_admin: "default",
  admin: "secondary",
  content_editor: "outline",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadUsers();
    loadSites();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        if (response.status === 403) {
          toast.error("Geen toegang tot gebruikersbeheer");
          return;
        }
        throw new Error("Failed to load users");
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Failed to load users:", error);
      toast.error("Kon gebruikers niet laden");
    } finally {
      setLoading(false);
    }
  };

  const loadSites = async () => {
    try {
      const response = await fetch("/api/admin/sites");
      if (!response.ok) throw new Error("Failed to load sites");
      const data = await response.json();
      setSites(data.sites || []);
    } catch (error) {
      console.error("Failed to load sites:", error);
    }
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <UserIcon className="size-4" />
        <span>{users.length} gebruikers</span>
      </div>

      {users.length === 0 ? (
        <div className="text-muted-foreground text-center text-sm py-8">
          Geen gebruikers gevonden.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Naam</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Sites</TableHead>
              <TableHead>2FA</TableHead>
              <TableHead>Aangemaakt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                className="cursor-pointer"
                onClick={() => handleUserClick(user)}
              >
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {user.email}
                </TableCell>
                <TableCell>
                  <Badge variant={ROLE_VARIANTS[user.role]}>
                    {ROLE_LABELS[user.role]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.sites.length > 0 ? (
                    <div className="flex gap-1 flex-wrap">
                      {user.sites.map((site) => (
                        <Badge key={site.id} variant="outline" className="text-xs">
                          {site.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {user.two_factor_enabled ? (
                    <ShieldCheckIcon className="size-4 text-green-600" />
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(user.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <UserEditDialog
        user={selectedUser}
        sites={sites}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdate={loadUsers}
      />
    </div>
  );
}
