import { betterAuth } from "better-auth";
import { Pool } from "pg";

// Create a temporary auth instance with sign-up enabled
const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  emailAndPassword: {
    enabled: true,
    // Temporarily enable sign-up for user creation
    disableSignUp: false,
  },
});

async function createAdmin(email: string, password: string, name: string) {
  try {
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    if (result) {
      console.log(`✅ Admin user created successfully!`);
      console.log(`   Email: ${email}`);
      console.log(`   Name: ${name}`);
    }
  } catch (error) {
    console.error("❌ Failed to create user:", error);
  } finally {
    process.exit(0);
  }
}

// Get arguments from command line
const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4] || "Admin";

if (!email || !password) {
  console.log("Usage: npx tsx scripts/create-admin.ts <email> <password> [name]");
  console.log("Example: npx tsx scripts/create-admin.ts admin@example.com secretpass123 'Admin Name'");
  process.exit(1);
}

createAdmin(email, password, name);
