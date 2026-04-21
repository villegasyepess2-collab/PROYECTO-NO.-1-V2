import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ingestTeamsTranscript } from "@/lib/services/teams-ingestion";
import type { TeamsIngestionRequest } from "@/lib/teams/types";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as TeamsIngestionRequest;

  if (!payload.meetingExternalId || !payload.organizerAadUserId || !payload.transcriptExternalId) {
    return NextResponse.json(
      { error: "meetingExternalId, organizerAadUserId, and transcriptExternalId are required" },
      { status: 400 }
    );
  }

  try {
    const result = await ingestTeamsTranscript(payload);

    return NextResponse.json({
      message: "Teams transcript ingested",
      actorUserId: session.userId,
      ...result
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Teams transcript ingestion failed",
        detail: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 502 }
    );
  }
}
