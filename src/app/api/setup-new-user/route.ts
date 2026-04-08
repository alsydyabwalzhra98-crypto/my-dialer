import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Setup new user after registration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, email, password } = body;

    if (!uid || !email) {
      return NextResponse.json({ ok: false, error: "UID and email required" });
    }

    const existingUser = await db.user.findUnique({ where: { uid } });

    if (!existingUser) {
      await db.user.create({
        data: {
          uid,
          email,
          password: password || null,
          balance: 1.0,
        },
      });
    }

    // Return the user data
    const user = await db.user.findUnique({ where: { uid } });
    const usNumber = user?.assignedUSNumber || `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;

    if (!user?.assignedUSNumber) {
      await db.user.update({
        where: { uid },
        data: { assignedUSNumber: usNumber },
      });
    }

    return NextResponse.json({
      ok: true,
      user: {
        uid,
        email: user?.email || email,
        balance: user?.balance || 1.0,
        assignedUSNumber: usNumber,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Setup failed";
    console.error("Setup new user error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
