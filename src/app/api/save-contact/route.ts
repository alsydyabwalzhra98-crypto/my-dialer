import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userUid, name, number } = body;

    if (!userUid || !name || !number) {
      return NextResponse.json({ ok: false, error: "Missing fields" });
    }

    const user = await db.user.findUnique({ where: { uid: userUid } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" });
    }

    const contact = await db.contact.create({
      data: { userId: user.id, userUid, name, number },
    });

    return NextResponse.json({ ok: true, contact });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
