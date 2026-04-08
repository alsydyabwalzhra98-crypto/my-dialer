import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userUid, to, type, cost, duration } = body;

    if (!userUid || !to) {
      return NextResponse.json({ ok: false, error: "Missing fields" });
    }

    const user = await db.user.findUnique({ where: { uid: userUid } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" });
    }

    // Deduct cost from balance
    const callCost = cost || 0;
    if (callCost > 0 && user.balance >= callCost) {
      await db.user.update({
        where: { uid: userUid },
        data: { balance: user.balance - callCost },
      });

      await db.transaction.create({
        data: { userUid, amount: -callCost, type: "call" },
      });
    }

    const log = await db.callLog.create({
      data: {
        userId: user.id,
        userUid,
        to,
        type: type || "outgoing",
        cost: callCost,
        duration: duration || 0,
      },
    });

    return NextResponse.json({ ok: true, log });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
