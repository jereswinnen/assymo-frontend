import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";

export async function POST() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update the user's mfaChoiceCompleted flag
    await sql`
      UPDATE "user"
      SET "mfaChoiceCompleted" = true
      WHERE id = ${user.id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update mfaChoiceCompleted:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
