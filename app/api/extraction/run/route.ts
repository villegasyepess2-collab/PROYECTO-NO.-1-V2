import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { runExtractionPipeline } from "@/lib/services/extraction-pipeline";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = (await request.json()) as {
    meetingId?: string;
    transcriptId?: string;
    transcriptText?: string;
  };

  if (!payload.meetingId || !payload.transcriptId || !payload.transcriptText) {
    return NextResponse.json({ error: "meetingId, transcriptId and transcriptText are required" }, { status: 400 });
  }

  try {
    const result = await runExtractionPipeline({
      meetingId: payload.meetingId,
      transcriptId: payload.transcriptId,
      transcriptText: payload.transcriptText
    });

    return NextResponse.json({ message: "Extraction completed", ...result });
  } catch (error) {
    return NextResponse.json(
      { error: "Extraction failed", detail: error instanceof Error ? error.message : "Unknown error" },
      { status: 502 }
    );
  }
}
