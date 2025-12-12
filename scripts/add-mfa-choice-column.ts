import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  const client = await pool.connect();
  try {
    // Add the column if it doesn't exist
    await client.query(`
      ALTER TABLE "user"
      ADD COLUMN IF NOT EXISTS "mfaChoiceCompleted" BOOLEAN NOT NULL DEFAULT false
    `);
    console.log("✅ Added mfaChoiceCompleted column to user table");

    // Set existing users with 2FA enabled to have mfaChoiceCompleted = true
    const result = await client.query(`
      UPDATE "user"
      SET "mfaChoiceCompleted" = true
      WHERE "twoFactorEnabled" = true
    `);
    console.log(`✅ Updated ${result.rowCount} existing users with 2FA to mfaChoiceCompleted=true`);
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
