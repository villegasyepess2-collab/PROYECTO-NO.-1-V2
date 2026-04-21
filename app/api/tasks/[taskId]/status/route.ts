import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createPocketBaseClient } from "@/lib/db/pocketbase";

const allowed = ["pending", "in_progress", "blocked", "overdue", "completed"];

export async function POST(request: Request, { params }: { params: { taskId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = (await request.json()) as { status?: string; note?: string };

  if (!payload.status || !allowed.includes(payload.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const pb = createPocketBaseClient();
    const serviceToken = process.env.POCKETBASE_SERVICE_TOKEN;
    if (serviceToken) pb.authStore.save(serviceToken, null);

    const current = await pb.collection("tasks").getOne(params.taskId);
    const updated = await pb.collection("tasks").update(params.taskId, {
      status: payload.status,
      completed_at: payload.status === "completed" ? new Date().toISOString() : null
    });

    await pb.collection("task_status_history").create({
      task_id: params.taskId,
      from_status: current.status,
      to_status: payload.status,
      changed_by: session.userId,
      changed_at: new Date().toISOString(),
      note: payload.note ?? "Status updated"
    });

    await pb.collection("audit_logs").create({
      actor_id: session.userId,
      action: "task_status_updated",
      entity_type: "task",
      entity_id: params.taskId,
      metadata: { from: current.status, to: payload.status }
    });

    return NextResponse.json({ message: "Status updated", id: updated.id, status: updated.status });
  } catch (error) {
    return NextResponse.json(
      { error: "Status update failed", detail: error instanceof Error ? error.message : "Unknown error" },
      { status: 502 }
    );
  }
}
