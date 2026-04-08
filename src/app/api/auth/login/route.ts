import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createHash } from "crypto";

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "abuzahra_salt_2024").digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "البريد الإلكتروني وكلمة المرور مطلوبان" });
    }

    // Find user by email
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
    }

    // Verify password
    const hashedPassword = hashPassword(password);
    if (user.password && user.password !== hashedPassword) {
      return NextResponse.json({ ok: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
    }

    return NextResponse.json({
      ok: true,
      user: {
        uid: user.uid,
        email: user.email,
        balance: user.balance,
        assignedUSNumber: user.assignedUSNumber,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Login failed";
    console.error("Login error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
