"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2Icon, ShieldCheckIcon, PlusIcon, Trash2Icon } from "lucide-react";
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
import { toast } from "sonner";
import { UserEditSheet } from "./sheets/UserEditSheet";
import { UserCreateSheet } from "./sheets/UserCreateSheet";
import { useAdminHeaderActions } from "@/components/admin/AdminHeaderContext";
import type { Role, FeatureOverrides, Feature } from "@/lib/permissions/types";
import { getEffectiveFeatures } from "@/lib/permissions/check";
import { t } from "@/config/strings";
import { useRequireFeature } from "@/lib/permissions/useRequireFeature";

interface Site {
  id: string;
  name: string;
  slug: string;
  capabilities?: Feature[];
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
  user: "Gebruiker",
};

const ROLE_VARIANTS: Record<Role, "default" | "secondary" | "outline"> = {
  super_admin: "default",
  admin: "secondary",
  content_editor: "outline",
  user: "outline",
};

const FEATURE_LABELS: Record<Feature, string> = {
  pages: "Pagina's",
  solutions: "Realisaties",
  navigation: "Navigatie",
  filters: "Filters",
  media: "Media",
  imageStudio: "Media Studio",
  parameters: "Parameters",
  appointments: "Afspraken",
  emails: "E-mails",
  conversations: "Conversaties",
  settings: "Instellingen",
  users: "Gebruikers",
  sites: "Sites",
};

export default function UsersPage() {
  const { authorized, loading: permissionLoading } = useRequireFeature("users");
  const [users, setUsers] = useState<User[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadUsers();
    loadSites();
  }, []);

  const openCreateDialog = useCallback(() => {
    setCreateDialogOpen(true);
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        if (response.status === 403) {
          toast.error(t("admin.messages.noUserAccess"));
          return;
        }
        throw new Error("Failed to load users");
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Failed to load users:", error);
      toast.error(t("admin.messages.usersLoadFailed"));
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
    setEditDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete");
      }

      toast.success(t("admin.messages.userDeleted"));
      setDeleteTarget(null);
      loadUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error(
        error instanceof Error ? error.message : t("admin.misc.userCouldNotDelete")
      );
    } finally {
      setDeleting(false);
    }
  };

  // Header actions
  const headerActions = useMemo(
    () => (
      <Button size="sm" onClick={openCreateDialog}>
        <PlusIcon className="size-4" />
        {t("admin.misc.newUser")}
      </Button>
    ),
    [openCreateDialog]
  );
  useAdminHeaderActions(headerActions);

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  };

  if (permissionLoading || !authorized) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {users.length === 0 ? (
        <div className="text-muted-foreground text-center text-sm py-8">
          {t("admin.misc.noUsersFound")}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.labels.name")}</TableHead>
              <TableHead>{t("admin.labels.email")}</TableHead>
              <TableHead>{t("admin.labels.role")}</TableHead>
              <TableHead>{t("admin.misc.sites")}</TableHead>
              <TableHead>{t("admin.labels.features")}</TableHead>
              <TableHead>2FA</TableHead>
              <TableHead>{t("admin.misc.created")}</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                className="group cursor-pointer"
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
                  {(() => {
                    const features = getEffectiveFeatures(user.role, user.feature_overrides);
                    if (user.role === "super_admin") {
                      return <span className="text-muted-foreground text-sm italic">Alle</span>;
                    }
                    if (features.length === 0) {
                      return <span className="text-muted-foreground text-sm">-</span>;
                    }
                    return (
                      <div className="flex gap-1 flex-wrap max-w-xs">
                        {features.slice(0, 3).map((feature) => (
                          <Badge key={feature} variant="secondary" className="text-xs">
                            {FEATURE_LABELS[feature]}
                          </Badge>
                        ))}
                        {features.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{features.length - 3}
                          </Badge>
                        )}
                      </div>
                    );
                  })()}
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
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(user);
                    }}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <UserEditSheet
        user={selectedUser}
        sites={sites}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onUpdate={loadUsers}
      />

      <UserCreateSheet
        sites={sites}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={loadUsers}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.misc.deleteUserQuestion")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.misc.deleteUserDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("admin.buttons.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  {t("admin.loading.deleting")}
                </>
              ) : (
                t("admin.buttons.delete")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
