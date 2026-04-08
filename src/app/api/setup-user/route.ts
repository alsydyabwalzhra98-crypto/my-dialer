import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Get user data including contacts, logs, messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid } = body;

    if (!uid) {
      return NextResponse.json({ ok: false, error: "UID required" });
    }

    const user = await db.user.findUnique({ where: { uid } });

    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" });
    }

    // Assign US number if not already assigned
    if (!user.assignedUSNumber) {
      const usNumber = `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
      await db.user.update({
        where: { uid },
        data: { assignedUSNumber: usNumber },
      });
    }

    // Fetch user data fresh
    const freshUser = await db.user.findUnique({ where: { uid } });

    // Fetch contacts, logs, messages
    const contacts = await db.contact.findMany({
      where: { userUid: uid },
      orderBy: { createdAt: "desc" },
    });

    const logs = await db.callLog.findMany({
      where: { userUid: uid },
      orderBy: { date: "desc" },
      take: 50,
    });

    const messages = await db.message.findMany({
      where: { userUid: uid },
      orderBy: { timestamp: "desc" },
      take: 50,
    });

    const transactions = await db.transaction.findMany({
      where: { userUid: uid },
      orderBy: { date: "desc" },
      take: 50,
    });

    return NextResponse.json({
      ok: true,
      user: {
        uid: freshUser?.uid,
        email: freshUser?.email,
        balance: freshUser?.balance || 1.0,
        assignedUSNumber: freshUser?.assignedUSNumber,
      },
      contacts,
      logs,
      messages,
      transactions,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Setup failed";
    console.error("Setup user error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
