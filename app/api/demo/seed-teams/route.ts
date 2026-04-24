import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isDemoLocalMode, seedTeamsTranscriptDemo } from "@/lib/demo/local-store";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isDemoLocalMode()) {
    return NextResponse.json(
      { error: "Teams demo seed is only available in local PoC bypass mode" },
      { status: 400 }
    );
  }

  const payload = (await request.json().catch(() => ({}))) as {
    meetingTitle?: string;
    transcriptText?: string;
  };

  const seeded = seedTeamsTranscriptDemo({
    meetingTitle: payload.meetingTitle,
    transcriptText: payload.transcriptText,
    organizerUserId: session.userId
  });

  return NextResponse.json({
    message: "Teams demo transcript loaded",
    actorUserId: session.userId,
    sourceKind: "teams_internal",
    ...seeded
  });
}
