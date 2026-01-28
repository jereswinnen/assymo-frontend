import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { type Feature, DEFAULT_ROLE } from "@/lib/permissions/types";
import { getEffectiveFeatures } from "@/lib/permissions/check";
import { getUserPermissions } from "@/lib/permissions/queries";

// Map features to their routes
const FEATURE_ROUTES: Record<Feature, string> = {
  appointments: "/admin/appointments",
  emails: "/admin/emails",
  conversations: "/admin/conversations",
  users: "/admin/users",
  sites: "/admin/sites",
  settings: "/admin/settings",
  pages: "/admin/content/pages",
  solutions: "/admin/content/solutions",
  media: "/admin/content/media",
  imageStudio: "/admin/content/image-studio",
  filters: "/admin/content/filters",
  navigation: "/admin/content/navigation",
  parameters: "/admin/content/parameters",
  configurator: "/admin/content/configurator",
};

// Priority order for redirects
const FEATURE_PRIORITY: Feature[] = [
  "appointments",
  "pages",
  "solutions",
  "emails",
  "conversations",
  "media",
  "filters",
  "navigation",
  "parameters",
  "settings",
  "users",
  "sites",
];

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/admin/auth");
  }

  // Query fresh permissions from database (not cached session)
  const permissions = await getUserPermissions(session.user.id);
  const role = permissions?.role || DEFAULT_ROLE;
  const effectiveFeatures = getEffectiveFeatures(role, permissions?.featureOverrides || null);

  // Find first available feature by priority
  const firstFeature = FEATURE_PRIORITY.find((f) => effectiveFeatures.includes(f));
  const targetRoute = firstFeature ? FEATURE_ROUTES[firstFeature] : "/admin/auth";

  redirect(targetRoute);
}
