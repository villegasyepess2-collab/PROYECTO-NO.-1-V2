import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ensureDemoScenario, isDemoLocalMode, rejectDemoCandidate } from "@/lib/demo/local-store";
import { rejectCandidate } from "@/lib/services/review-workflow";

export async function POST(request: Request, { params }: { params: { candidateId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = (await request.json()) as { note?: string };

  if (isDemoLocalMode()) {
    ensureDemoScenario();
    try {
      const result = rejectDemoCandidate(params.candidateId);
      return NextResponse.json({ message: "Candidate rejected (demo mode)", id: result.id });
    } catch (error) {
      return NextResponse.json(
        { error: "Reject failed", detail: error instanceof Error ? error.message : "Unknown error" },
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

    return NextResponse.json({ message: "Candidate rejected", id: result.id });
  } catch (error) {
    return NextResponse.json(
      { error: "Reject failed", detail: error instanceof Error ? error.message : "Unknown error" },
      { status: 502 }
    );
  }
}
