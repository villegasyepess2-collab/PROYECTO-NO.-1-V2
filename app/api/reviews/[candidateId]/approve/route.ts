import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { approveDemoCandidate, isDemoLocalMode } from "@/lib/demo/local-store";
import { createAndSendTaskCreatedNotifications } from "@/lib/services/notifications";
import { approveCandidateAndCreateTask } from "@/lib/services/review-workflow";

export async function POST(request: Request, { params }: { params: { candidateId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const payload = (await request.json()) as {
    responsibleUserId?: string;
    requesterUserId?: string;
    dueDate?: string;
    note?: string;
  };

  if (!payload.responsibleUserId || !payload.requesterUserId || !payload.dueDate) {
    return NextResponse.json(
      { error: "responsibleUserId, requesterUserId y dueDate son obligatorios" },
      { status: 400 }
    );
  }

  if (isDemoLocalMode()) {
    try {
      const task = approveDemoCandidate({
        candidateId: params.candidateId,
        responsibleUserId: payload.responsibleUserId,
        requesterUserId: payload.requesterUserId,
        dueDate: payload.dueDate,
        note: payload.note,
        reviewerId: session.userId
      });

      const notifications = await createAndSendTaskCreatedNotifications({
        taskId: task.id,
        responsibleUserId: task.responsible_user_id,
        requesterUserId: task.requester_user_id,
        taskTitle: task.title,
        dueDate: task.due_date,
        sourceExcerpt: task.source_excerpt
      });

      return NextResponse.json({
        message: "Candidato aprobado y tarea creada (modo demo)",
        taskId: task.id,
        reviewId: `demo_review_${params.candidateId}`,
        notifications
      });
    } catch (error) {
      return NextResponse.json(
        { error: "Error al aprobar", detail: error instanceof Error ? error.message : "Error desconocido" },
        { status: 404 }
      );
    }
  }

  try {
    const result = await approveCandidateAndCreateTask({
      candidateId: params.candidateId,
      reviewerId: session.userId,
      responsibleUserId: payload.responsibleUserId,
      requesterUserId: payload.requesterUserId,
      dueDate: payload.dueDate,
      note: payload.note
    });

    return NextResponse.json({ message: "Candidato aprobado y tarea creada", ...result });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al aprobar", detail: error instanceof Error ? error.message : "Error desconocido" },
      { status: 502 }
    );
  }
}
