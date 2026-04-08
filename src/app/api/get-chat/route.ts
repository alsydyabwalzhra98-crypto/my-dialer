import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userUid = searchParams.get("uid");
    const number = searchParams.get("number");

    if (!userUid || !number) {
      return NextResponse.json({ ok: false, error: "Missing params" });
    }

    const chatMessages = await db.message.findMany({
      where: { userUid, number },
      orderBy: { timestamp: "asc" },
      take: 100,
    });

    return NextResponse.json({ ok: true, messages: chatMessages });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
