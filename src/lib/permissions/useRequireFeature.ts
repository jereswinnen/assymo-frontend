"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSiteContext } from "./site-context";
import type { Feature } from "./types";
import { GLOBAL_FEATURES } from "./types";

/**
 * Hook to require a specific feature for accessing a page.
 * Redirects to /admin if the user doesn't have access.
 *
 * For global features (appointments, emails, etc.), checks effectiveFeatures.
 * For site-scoped features (pages, solutions, etc.), checks visibleFeatures.
 *
 * Usage:
 * ```tsx
 * export default function AppointmentsPage() {
 *   const { authorized, loading } = useRequireFeature("appointments");
 *
 *   if (loading || !authorized) {
 *     return null; // or a loading skeleton
 *   }
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useRequireFeature(feature: Feature) {
  const router = useRouter();
  const { visibleFeatures, effectiveFeatures, loading } = useSiteContext();

  // Global features check effectiveFeatures (not site-dependent)
  // Site-scoped features check visibleFeatures (intersected with site capabilities)
  const isGlobalFeature = GLOBAL_FEATURES.includes(feature);
  const featuresToCheck = isGlobalFeature ? effectiveFeatures : visibleFeatures;
  const authorized = !loading && featuresToCheck.includes(feature);

  useEffect(() => {
    if (!loading && !featuresToCheck.includes(feature)) {
      router.replace("/admin");
    }
  }, [loading, featuresToCheck, feature, router]);

  return { authorized, loading };
}
