import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserSiteIds } from "@/lib/permissions/queries";
import type { PermissionContext, Role } from "@/lib/permissions/types";

/**
 * Check if the current request is authenticated
 * Use in API routes: `const authenticated = await isAuthenticated();`
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

/**
 * Get the current session
 * Returns null if not authenticated
 */
export async function getSession() {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });
  return session;
}

/**
 * Get the current user
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

/**
 * Get the current user's permission context
 * Includes user info and their site assignments
 * Returns null if not authenticated
 */
export async function getPermissionContext(): Promise<PermissionContext | null> {
  const session = await getSession();
  if (!session?.user) return null;

  const user = session.user;
  const userSites = await getUserSiteIds(user.id);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: (user.role as Role) || "content_editor",
      featureOverrides: user.featureOverrides as PermissionContext["user"]["featureOverrides"],
    },
    userSites,
  };
}
