import { cookies } from "next/headers";
import { randomBytes, createHmac } from "crypto";

const SESSION_COOKIE_NAME = "admin_session";
const SESSION_EXPIRY_HOURS = 24;

/**
 * Validate admin password against environment variable
 */
export function validatePassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error("ADMIN_PASSWORD environment variable is not set");
    return false;
  }

  return password === adminPassword;
}

/**
 * Generate a secure session token
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Sign a session token with HMAC
 */
function signToken(token: string): string {
  const secret = process.env.SESSION_SECRET || "fallback-secret-change-in-production";
  return createHmac("sha256", secret).update(token).digest("hex");
}

/**
 * Verify a signed session token
 */
function verifyToken(token: string, signature: string): boolean {
  const expectedSignature = signToken(token);
  return signature === expectedSignature;
}

/**
 * Set session cookie
 */
export async function setSessionCookie(token: string): Promise<void> {
  const signature = signToken(token);
  const cookieStore = await cookies();
  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + SESSION_EXPIRY_HOURS);

  cookieStore.set(SESSION_COOKIE_NAME, `${token}.${signature}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiryDate,
    path: "/",
  });
}

/**
 * Get and validate session from cookie
 */
export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  const [token, signature] = sessionCookie.value.split(".");

  if (!token || !signature) {
    return null;
  }

  if (!verifyToken(token, signature)) {
    return null;
  }

  return token;
}

/**
 * Clear session cookie (logout)
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}
