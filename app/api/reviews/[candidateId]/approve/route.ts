import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { approveCandidateAndCreateTask } from "@/lib/services/review-workflow";

export async function POST(request: Request, { params }: { params: { candidateId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = (await request.json()) as {
    responsibleUserId?: string;
    requesterUserId?: string;
    dueDate?: string;
    note?: string;
  };

  if (!payload.responsibleUserId || !payload.requesterUserId || !payload.dueDate) {
    return NextResponse.json(
      { error: "responsibleUserId, requesterUserId, and dueDate are required" },
      { status: 400 }
    );
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

    return NextResponse.json({ message: "Candidate approved and task created", ...result });
  } catch (error) {
    return NextResponse.json(
      { error: "Approval failed", detail: error instanceof Error ? error.message : "Unknown error" },
      { status: 502 }
    );
  }
}
