import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isDemoLocalMode, rejectDemoCandidate } from "@/lib/demo/local-store";
import { rejectCandidate } from "@/lib/services/review-workflow";

export async function POST(request: Request, { params }: { params: { candidateId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const payload = (await request.json()) as { note?: string };

  if (isDemoLocalMode()) {
    try {
      const result = rejectDemoCandidate({
        candidateId: params.candidateId,
        reviewerId: session.userId,
        note: payload.note
      });
      return NextResponse.json({ message: "Candidato rechazado (modo demo)", id: result.id });
    } catch (error) {
      return NextResponse.json(
        { error: "Error al rechazar", detail: error instanceof Error ? error.message : "Error desconocido" },
        { status: 404 }
      );
    }
  }

  try {
    const result = await rejectCandidate({
      candidateId: params.candidateId,
      reviewerId: session.userId,
      note: payload.note
    });

    return NextResponse.json({ message: "Candidato rechazado", id: result.id });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al rechazar", detail: error instanceof Error ? error.message : "Error desconocido" },
      { status: 502 }
    );
  }
}
