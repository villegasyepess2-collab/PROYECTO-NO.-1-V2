import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { editDemoCandidate, isDemoLocalMode } from "@/lib/demo/local-store";
import { editCandidate } from "@/lib/services/review-workflow";

export async function POST(request: Request, { params }: { params: { candidateId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const payload = (await request.json()) as { patch?: Record<string, unknown>; note?: string };

  if (!payload.patch || typeof payload.patch !== "object") {
    return NextResponse.json({ error: "patch es obligatorio" }, { status: 400 });
  }

  if (isDemoLocalMode()) {
    try {
      const patch = payload.patch as Record<string, unknown>;
      const result = editDemoCandidate({
        candidateId: params.candidateId,
        title: typeof patch.title === "string" ? patch.title : undefined,
        responsibleUserId:
          typeof patch.proposed_responsible_user_id === "string" ? patch.proposed_responsible_user_id : undefined,
        dueDate: typeof patch.due_date === "string" ? patch.due_date : undefined,
        note: payload.note,
        reviewerId: session.userId
      });
      return NextResponse.json({ message: "Candidato actualizado (modo demo)", id: result.id });
    } catch (error) {
      return NextResponse.json(
        { error: "Error al editar", detail: error instanceof Error ? error.message : "Error desconocido" },
        { status: 400 }
      );
    }
  }

  try {
    const updated = await editCandidate({
      candidateId: params.candidateId,
      reviewerId: session.userId,
      patch: payload.patch,
      note: payload.note
    });

    return NextResponse.json({ message: "Candidato actualizado", id: updated.id });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al editar", detail: error instanceof Error ? error.message : "Error desconocido" },
      { status: 502 }
    );
  }
}
