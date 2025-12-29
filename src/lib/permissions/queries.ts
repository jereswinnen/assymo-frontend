import { neon } from "@neondatabase/serverless";
import type { Site, Role, FeatureOverrides } from "./types";

const sql = neon(process.env.DATABASE_URL!);

/**
 * Get all site IDs that a user has access to
 */
export async function getUserSiteIds(userId: string): Promise<string[]> {
  const rows = await sql`
    SELECT site_id FROM user_sites WHERE user_id = ${userId}
  `;
  return rows.map((row) => row.site_id as string);
}

/**
 * Get all sites that a user has access to (full site objects)
 */
export async function getUserSites(userId: string): Promise<Site[]> {
  const rows = await sql`
    SELECT s.id, s.name, s.slug, s.domain, s.is_active, s.created_at, s.updated_at
    FROM sites s
    JOIN user_sites us ON s.id = us.site_id
    WHERE us.user_id = ${userId}
    ORDER BY s.name
  `;

  return rows.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    domain: row.domain as string | null,
    isActive: row.is_active as boolean,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }));
}

/**
 * Get all sites (for super_admin)
 */
export async function getAllSites(): Promise<Site[]> {
  const rows = await sql`
    SELECT id, name, slug, domain, is_active, created_at, updated_at
    FROM sites
    WHERE is_active = true
    ORDER BY name
  `;

  return rows.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    domain: row.domain as string | null,
    isActive: row.is_active as boolean,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }));
}

/**
 * Get a site by ID
 */
export async function getSiteById(siteId: string): Promise<Site | null> {
  const rows = await sql`
    SELECT id, name, slug, domain, is_active, created_at, updated_at
    FROM sites
    WHERE id = ${siteId}
  `;

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    domain: row.domain as string | null,
    isActive: row.is_active as boolean,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

/**
 * Get a site by slug
 */
export async function getSiteBySlug(slug: string): Promise<Site | null> {
  const rows = await sql`
    SELECT id, name, slug, domain, is_active, created_at, updated_at
    FROM sites
    WHERE slug = ${slug}
  `;

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    domain: row.domain as string | null,
    isActive: row.is_active as boolean,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

/**
 * Get user's role and feature overrides
 */
export async function getUserPermissions(
  userId: string
): Promise<{ role: Role; featureOverrides: FeatureOverrides | null } | null> {
  const rows = await sql`
    SELECT role, feature_overrides
    FROM "user"
    WHERE id = ${userId}
  `;

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    role: row.role as Role,
    featureOverrides: row.feature_overrides as FeatureOverrides | null,
  };
}

/**
 * Assign a user to a site
 */
export async function assignUserToSite(
  userId: string,
  siteId: string
): Promise<void> {
  await sql`
    INSERT INTO user_sites (user_id, site_id)
    VALUES (${userId}, ${siteId})
    ON CONFLICT DO NOTHING
  `;
}

/**
 * Remove a user from a site
 */
export async function removeUserFromSite(
  userId: string,
  siteId: string
): Promise<void> {
  await sql`
    DELETE FROM user_sites
    WHERE user_id = ${userId} AND site_id = ${siteId}
  `;
}

/**
 * Update a user's role
 */
export async function updateUserRole(
  userId: string,
  role: Role
): Promise<void> {
  await sql`
    UPDATE "user"
    SET role = ${role}
    WHERE id = ${userId}
  `;
}

/**
 * Update a user's feature overrides
 */
export async function updateUserFeatureOverrides(
  userId: string,
  overrides: FeatureOverrides | null
): Promise<void> {
  await sql`
    UPDATE "user"
    SET feature_overrides = ${overrides ? JSON.stringify(overrides) : null}
    WHERE id = ${userId}
  `;
}
