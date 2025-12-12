import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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
