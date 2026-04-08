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

    if (password.length < 6) {
      return NextResponse.json({ ok: false, error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ ok: false, error: "هذا البريد الإلكتروني مسجل مسبقاً" });
    }

    const uid = "user_" + email.replace(/[^a-z0-9]/gi, "_") + "_" + Date.now();
    const hashedPassword = hashPassword(password);

    // Generate a US phone number
    const usNumber = `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;

    // Create user
    const user = await db.user.create({
      data: {
        uid,
        email,
        password: hashedPassword,
        balance: 1.0,
        assignedUSNumber: usNumber,
      },
    });

    // Add welcome notification
    await db.message.create({
      data: {
        userId: user.id,
        userUid: uid,
        number: "system",
        name: "النظام",
        text: `مرحباً بك في أبو الزهراء! رصيدك الحالي $1.00`,
        type: "received",
        timestamp: Date.now(),
      },
    });

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
    const message = e instanceof Error ? e.message : "Registration failed";
    console.error("Register error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
