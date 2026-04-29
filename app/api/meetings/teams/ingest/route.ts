import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ensureDemoScenario, isDemoLocalMode } from "@/lib/demo/local-store";
import { ingestTeamsTranscript } from "@/lib/services/teams-ingestion";
import type { TeamsIngestionRequest } from "@/lib/teams/types";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const payload = (await request.json()) as TeamsIngestionRequest;

  if (isDemoLocalMode()) {
    const summary = ensureDemoScenario();
    return NextResponse.json({
      message: "Transcripción de Teams cargada (modo demo simulado)",
      actorUserId: session.userId,
      meetingSourceId: "demo_source_teams",
      meetingId: "demo_seeded_meeting",
      transcriptId: "demo_seeded_transcript",
      normalizedLength: 132,
      summary
    });
  }

  if (!payload.meetingExternalId || !payload.organizerAadUserId || !payload.transcriptExternalId) {
    return NextResponse.json(
      { error: "meetingExternalId, organizerAadUserId y transcriptExternalId son obligatorios" },
      { status: 400 }
    );
  }

  try {
    const result = await ingestTeamsTranscript(payload);

    return NextResponse.json({
      message: "Transcripción de Teams cargada",
      actorUserId: session.userId,
      ...result
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Error al cargar la transcripción de Teams",
        detail: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 502 }
    );
  }
}
