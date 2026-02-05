import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

export const sql = neon(databaseUrl);

export async function getSiteIdBySlug(slug: string): Promise<string | null> {
  const result = await sql`
    SELECT id FROM sites WHERE slug = ${slug}
  `;

  if (result.length === 0) {
    return null;
  }

  return result[0].id as string;
}

export interface Site {
  id: string;
  name: string;
  slug: string;
}

export async function listSites(): Promise<Site[]> {
  const result = await sql`
    SELECT id, name, slug FROM sites ORDER BY name
  `;

  return result as Site[];
}
