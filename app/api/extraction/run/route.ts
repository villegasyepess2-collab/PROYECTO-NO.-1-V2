import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { runExtractionPipeline } from "@/lib/services/extraction-pipeline";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const payload = (await request.json()) as {
    meetingId?: string;
    transcriptId?: string;
    transcriptText?: string;
  };

  if (!payload.meetingId || !payload.transcriptId || !payload.transcriptText) {
    return NextResponse.json({ error: "meetingId, transcriptId y transcriptText son obligatorios" }, { status: 400 });
  }

  try {
    const result = await runExtractionPipeline({
      meetingId: payload.meetingId,
      transcriptId: payload.transcriptId,
      transcriptText: payload.transcriptText
    });

    return NextResponse.json({ message: "Extracción completada", ...result });
  } catch (error) {
    return NextResponse.json(
      { error: "Error de extracción", detail: error instanceof Error ? error.message : "Error desconocido" },
      { status: 502 }
    );
  }
}
