import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  type Role,
  type Feature,
  DEFAULT_ROLE,
  getEffectiveFeatures,
  parseFeatureOverrides,
} from "@/lib/permissions";

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
  filters: "/admin/content/filters",
  navigation: "/admin/content/navigation",
  parameters: "/admin/content/parameters",
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

  // Calculate effective features
  const user = session.user as { role?: string; featureOverrides?: string };
  const role = (user.role as Role) || DEFAULT_ROLE;
  const overrides = parseFeatureOverrides(user.featureOverrides);
  const effectiveFeatures = getEffectiveFeatures(role, overrides);

  // Find first available feature by priority
  const firstFeature = FEATURE_PRIORITY.find((f) => effectiveFeatures.includes(f));
  const targetRoute = firstFeature ? FEATURE_ROUTES[firstFeature] : "/admin/content/pages";

  redirect(targetRoute);
}
