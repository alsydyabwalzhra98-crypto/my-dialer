import { NextRequest, NextResponse } from "next/server";

// TwiML endpoint for voice call routing
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const to = formData.get("To") || formData.get("to") || "";

    const twilio = await import("twilio");
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();

    if (typeof to === "string" && to) {
      const dial = response.dial({ callerId: process.env.TWILIO_PHONE_NUMBER || "" });
      dial.number(to);
    } else {
      response.say({ language: "ar-SA" }, "رقم الهاتف غير محدد");
    }

    return new NextResponse(response.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "TwiML error";
    console.error("TwiML error:", message);
    return new NextResponse("<Response></Response>", {
      headers: { "Content-Type": "text/xml" },
    });
  }
}
