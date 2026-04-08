import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contactId } = body;

    if (!contactId) {
      return NextResponse.json({ ok: false, error: "Contact ID required" });
    }

    const contact = await db.contact.findUnique({ where: { id: contactId } });
    if (!contact) {
      return NextResponse.json({ ok: false, error: "Contact not found" });
    }

    const updated = await db.contact.update({
      where: { id: contactId },
      data: { favorite: !contact.favorite },
    });

    return NextResponse.json({ ok: true, contact: updated });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
