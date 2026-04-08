import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userUid, number, name, text, type } = body;

    if (!userUid || !number || !text) {
      return NextResponse.json({ ok: false, error: "Missing fields" });
    }

    const user = await db.user.findUnique({ where: { uid: userUid } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" });
    }

    const message = await db.message.create({
      data: {
        userId: user.id,
        userUid,
        number,
        name: name || null,
        text,
        type: type || "sent",
        timestamp: Date.now(),
      },
    });

    return NextResponse.json({ ok: true, message });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
