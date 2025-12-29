import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join } from "path";

// Read DATABASE_URL from .env.local
const envPath = join(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
const match = envContent.match(/DATABASE_URL=["']?([^\n"']+)["']?/);
if (!match) {
  throw new Error("DATABASE_URL not found in .env.local");
}
const DATABASE_URL = match[1];

const sql = neon(DATABASE_URL);

async function migrate() {
  console.log("Starting Phase 5 migrations...\n");

  // Get the Assymo site ID first
  const sites = await sql`SELECT id FROM sites WHERE slug = 'assymo'`;
  if (sites.length === 0) {
    throw new Error("Assymo site not found!");
  }
  const assymoSiteId = sites[0].id;
  console.log("Assymo site ID:", assymoSiteId);

  // 1. Add site_id columns
  console.log("\n1. Adding site_id columns...");

  try {
    await sql`ALTER TABLE pages ADD COLUMN IF NOT EXISTS site_id TEXT REFERENCES sites(id)`;
    console.log("  ✓ pages");
  } catch (e) { console.log("  - pages:", (e as Error).message); }

  try {
    await sql`ALTER TABLE solutions ADD COLUMN IF NOT EXISTS site_id TEXT REFERENCES sites(id)`;
    console.log("  ✓ solutions");
  } catch (e) { console.log("  - solutions:", (e as Error).message); }

  try {
    await sql`ALTER TABLE filters ADD COLUMN IF NOT EXISTS site_id TEXT REFERENCES sites(id)`;
    console.log("  ✓ filters");
  } catch (e) { console.log("  - filters:", (e as Error).message); }

  try {
    await sql`ALTER TABLE filter_categories ADD COLUMN IF NOT EXISTS site_id TEXT REFERENCES sites(id)`;
    console.log("  ✓ filter_categories");
  } catch (e) { console.log("  - filter_categories:", (e as Error).message); }

  try {
    await sql`ALTER TABLE navigation_links ADD COLUMN IF NOT EXISTS site_id TEXT REFERENCES sites(id)`;
    console.log("  ✓ navigation_links");
  } catch (e) { console.log("  - navigation_links:", (e as Error).message); }

  try {
    await sql`ALTER TABLE image_metadata ADD COLUMN IF NOT EXISTS site_id TEXT REFERENCES sites(id)`;
    console.log("  ✓ image_metadata");
  } catch (e) { console.log("  - image_metadata:", (e as Error).message); }

  try {
    await sql`ALTER TABLE media_folders ADD COLUMN IF NOT EXISTS site_id TEXT REFERENCES sites(id)`;
    console.log("  ✓ media_folders");
  } catch (e) { console.log("  - media_folders:", (e as Error).message); }

  try {
    await sql`ALTER TABLE site_parameters ADD COLUMN IF NOT EXISTS site_id TEXT REFERENCES sites(id)`;
    console.log("  ✓ site_parameters");
  } catch (e) { console.log("  - site_parameters:", (e as Error).message); }

  // 2. Assign existing content to Assymo site
  console.log("\n2. Assigning existing content to Assymo site...");

  try {
    await sql`UPDATE pages SET site_id = ${assymoSiteId} WHERE site_id IS NULL`;
    console.log("  ✓ pages");
  } catch (e) { console.log("  - pages:", (e as Error).message); }

  try {
    await sql`UPDATE solutions SET site_id = ${assymoSiteId} WHERE site_id IS NULL`;
    console.log("  ✓ solutions");
  } catch (e) { console.log("  - solutions:", (e as Error).message); }

  try {
    await sql`UPDATE filters SET site_id = ${assymoSiteId} WHERE site_id IS NULL`;
    console.log("  ✓ filters");
  } catch (e) { console.log("  - filters:", (e as Error).message); }

  try {
    await sql`UPDATE filter_categories SET site_id = ${assymoSiteId} WHERE site_id IS NULL`;
    console.log("  ✓ filter_categories");
  } catch (e) { console.log("  - filter_categories:", (e as Error).message); }

  try {
    await sql`UPDATE navigation_links SET site_id = ${assymoSiteId} WHERE site_id IS NULL`;
    console.log("  ✓ navigation_links");
  } catch (e) { console.log("  - navigation_links:", (e as Error).message); }

  try {
    await sql`UPDATE image_metadata SET site_id = ${assymoSiteId} WHERE site_id IS NULL`;
    console.log("  ✓ image_metadata");
  } catch (e) { console.log("  - image_metadata:", (e as Error).message); }

  try {
    await sql`UPDATE media_folders SET site_id = ${assymoSiteId} WHERE site_id IS NULL`;
    console.log("  ✓ media_folders");
  } catch (e) { console.log("  - media_folders:", (e as Error).message); }

  try {
    await sql`UPDATE site_parameters SET site_id = ${assymoSiteId} WHERE site_id IS NULL`;
    console.log("  ✓ site_parameters");
  } catch (e) { console.log("  - site_parameters:", (e as Error).message); }

  // 3. Create indexes
  console.log("\n3. Creating indexes...");

  try {
    await sql`CREATE INDEX IF NOT EXISTS pages_site_idx ON pages(site_id)`;
    console.log("  ✓ pages_site_idx");
  } catch (e) { console.log("  - pages_site_idx:", (e as Error).message); }

  try {
    await sql`CREATE INDEX IF NOT EXISTS solutions_site_idx ON solutions(site_id)`;
    console.log("  ✓ solutions_site_idx");
  } catch (e) { console.log("  - solutions_site_idx:", (e as Error).message); }

  try {
    await sql`CREATE INDEX IF NOT EXISTS filters_site_idx ON filters(site_id)`;
    console.log("  ✓ filters_site_idx");
  } catch (e) { console.log("  - filters_site_idx:", (e as Error).message); }

  try {
    await sql`CREATE INDEX IF NOT EXISTS filter_categories_site_idx ON filter_categories(site_id)`;
    console.log("  ✓ filter_categories_site_idx");
  } catch (e) { console.log("  - filter_categories_site_idx:", (e as Error).message); }

  try {
    await sql`CREATE INDEX IF NOT EXISTS navigation_links_site_idx ON navigation_links(site_id)`;
    console.log("  ✓ navigation_links_site_idx");
  } catch (e) { console.log("  - navigation_links_site_idx:", (e as Error).message); }

  try {
    await sql`CREATE INDEX IF NOT EXISTS image_metadata_site_idx ON image_metadata(site_id)`;
    console.log("  ✓ image_metadata_site_idx");
  } catch (e) { console.log("  - image_metadata_site_idx:", (e as Error).message); }

  try {
    await sql`CREATE INDEX IF NOT EXISTS media_folders_site_idx ON media_folders(site_id)`;
    console.log("  ✓ media_folders_site_idx");
  } catch (e) { console.log("  - media_folders_site_idx:", (e as Error).message); }

  try {
    await sql`CREATE INDEX IF NOT EXISTS site_parameters_site_idx ON site_parameters(site_id)`;
    console.log("  ✓ site_parameters_site_idx");
  } catch (e) { console.log("  - site_parameters_site_idx:", (e as Error).message); }

  // 4. Verify migration
  console.log("\n4. Verifying migration...");

  const pagesCount = await sql`SELECT COUNT(*) as total, COUNT(site_id) as with_site FROM pages`;
  console.log(`  pages: ${pagesCount[0].with_site}/${pagesCount[0].total}`);

  const solutionsCount = await sql`SELECT COUNT(*) as total, COUNT(site_id) as with_site FROM solutions`;
  console.log(`  solutions: ${solutionsCount[0].with_site}/${solutionsCount[0].total}`);

  const filtersCount = await sql`SELECT COUNT(*) as total, COUNT(site_id) as with_site FROM filters`;
  console.log(`  filters: ${filtersCount[0].with_site}/${filtersCount[0].total}`);

  const filterCategoriesCount = await sql`SELECT COUNT(*) as total, COUNT(site_id) as with_site FROM filter_categories`;
  console.log(`  filter_categories: ${filterCategoriesCount[0].with_site}/${filterCategoriesCount[0].total}`);

  const navLinksCount = await sql`SELECT COUNT(*) as total, COUNT(site_id) as with_site FROM navigation_links`;
  console.log(`  navigation_links: ${navLinksCount[0].with_site}/${navLinksCount[0].total}`);

  const imageMetadataCount = await sql`SELECT COUNT(*) as total, COUNT(site_id) as with_site FROM image_metadata`;
  console.log(`  image_metadata: ${imageMetadataCount[0].with_site}/${imageMetadataCount[0].total}`);

  const mediaFoldersCount = await sql`SELECT COUNT(*) as total, COUNT(site_id) as with_site FROM media_folders`;
  console.log(`  media_folders: ${mediaFoldersCount[0].with_site}/${mediaFoldersCount[0].total}`);

  const siteParametersCount = await sql`SELECT COUNT(*) as total, COUNT(site_id) as with_site FROM site_parameters`;
  console.log(`  site_parameters: ${siteParametersCount[0].with_site}/${siteParametersCount[0].total}`);

  console.log("\nMigration complete!");
}

migrate().catch(console.error);
