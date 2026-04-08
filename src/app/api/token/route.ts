import { NextRequest, NextResponse } from "next/server";

// Twilio Voice Token endpoint
export async function GET(request: NextRequest) {
  const identity = request.nextUrl.searchParams.get("identity") || "user";

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKey = process.env.TWILIO_API_KEY;
    const apiSecret = process.env.TWILIO_API_SECRET;
    const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;

    if (!accountSid || !apiKey || !apiSecret || !twimlAppSid) {
      console.warn("Twilio credentials missing — returning empty token");
      return new NextResponse("", { status: 200 });
    }

    // Dynamic import to avoid bundling Twilio in client
    const twilio = await import("twilio");
    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    const token = new AccessToken(accountSid, apiKey, apiSecret, {
      identity,
      ttl: 3600,
    });

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true,
    });
    token.addGrant(voiceGrant);

    return new NextResponse(token.toJwt(), {
      headers: { "Content-Type": "text/plain" },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to generate token";
    console.error("Twilio token error:", message);
    return NextResponse.json({ error: "Failed to generate token" }, { status: 500 });
  }
}
