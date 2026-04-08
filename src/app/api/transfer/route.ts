import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromUid, toUid, amount } = body;

    if (!fromUid || !toUid || !amount || amount <= 0) {
      return NextResponse.json({ ok: false, error: "Invalid fields" });
    }

    if (fromUid === toUid) {
      return NextResponse.json({ ok: false, error: "Cannot transfer to self" });
    }

    const fromUser = await db.user.findUnique({ where: { uid: fromUid } });
    const toUser = await db.user.findUnique({ where: { uid: toUid } });

    if (!fromUser || !toUser) {
      return NextResponse.json({ ok: false, error: "User not found" });
    }

    if (fromUser.balance < amount) {
      return NextResponse.json({ ok: false, error: "Insufficient balance" });
    }

    // Transfer
    await db.user.update({
      where: { uid: fromUid },
      data: { balance: fromUser.balance - amount },
    });

    await db.user.update({
      where: { uid: toUid },
      data: { balance: toUser.balance + amount },
    });

    await db.transaction.create({
      data: { userUid: fromUid, amount: -amount, type: "transfer" },
    });

    await db.transaction.create({
      data: { userUid: toUid, amount, type: "transfer" },
    });

    return NextResponse.json({ ok: true, newBalance: fromUser.balance - amount });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
