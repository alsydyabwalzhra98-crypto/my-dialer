import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userUid, amount } = body;

    if (!userUid || !amount || amount <= 0) {
      return NextResponse.json({ ok: false, error: "Invalid fields" });
    }

    const user = await db.user.findUnique({ where: { uid: userUid } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" });
    }

    const newBalance = user.balance + amount;

    await db.user.update({
      where: { uid: userUid },
      data: { balance: newBalance },
    });

    await db.transaction.create({
      data: { userUid, amount, type: "topup" },
    });

    return NextResponse.json({ ok: true, newBalance });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
