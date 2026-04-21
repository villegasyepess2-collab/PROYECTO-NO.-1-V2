import { createPocketBaseClient } from "@/lib/db/pocketbase";
import { canCreateFinalTask } from "@/lib/domain/rules";
import type { TaskCandidate } from "@/lib/domain/entities";
import { createAndSendTaskCreatedNotifications } from "@/lib/services/notifications";

function mapRecordToCandidate(record: any): TaskCandidate {
  return {
    id: record.id,
    meetingId: record.meeting_id,
    transcriptId: record.transcript_id,
    title: record.title,
    description: record.description,
    sourceExcerpt: record.source_excerpt,
    proposedResponsibleUserId: record.proposed_responsible_user_id,
    proposedRequesterUserId: record.proposed_requester_user_id,
    dueDate: record.due_date,
    confidenceScore: Number(record.confidence_score ?? 0),
    validationRequired: Boolean(record.validation_required),
    status: record.status,
    ambiguityReasons: record.ambiguity_reasons ?? [],
    createdAt: record.created
  };
}

export async function approveCandidateAndCreateTask(params: {
  candidateId: string;
  reviewerId: string;
  responsibleUserId: string;
  requesterUserId: string;
  dueDate: string;
  note?: string;
}) {
  const pb = createPocketBaseClient();
  const serviceToken = process.env.POCKETBASE_SERVICE_TOKEN;
  if (serviceToken) pb.authStore.save(serviceToken, null);

  const candidateRecord = await pb.collection("task_candidates").getOne(params.candidateId);

  const patchedRecord = await pb.collection("task_candidates").update(params.candidateId, {
    proposed_responsible_user_id: params.responsibleUserId,
    proposed_requester_user_id: params.requesterUserId,
    due_date: params.dueDate,
    validation_required: false,
    status: "approved"
  });

  const candidate = mapRecordToCandidate(patchedRecord);
  const guard = canCreateFinalTask(candidate);
  if (!guard.allowed) {
    throw new Error(guard.reason ?? "Candidate validation failed");
  }

  const review = await pb.collection("task_reviews").create({
    candidate_id: params.candidateId,
    reviewer_id: params.reviewerId,
    action: "approve",
    notes: params.note ?? "Approved in review workflow",
    reviewed_at: new Date().toISOString()
  });

  const task = await pb.collection("tasks").create({
    meeting_id: candidate.meetingId,
    task_candidate_id: candidate.id,
    title: candidate.title,
    description: candidate.description,
    source_excerpt: candidate.sourceExcerpt,
    responsible_user_id: candidate.proposedResponsibleUserId,
    requester_user_id: candidate.proposedRequesterUserId,
    due_date: candidate.dueDate,
    status: "pending"
  });

  await pb.collection("task_status_history").create({
    task_id: task.id,
    from_status: null,
    to_status: "pending",
    changed_by: params.reviewerId,
    changed_at: new Date().toISOString(),
    note: "Initial task creation after review"
  });

  await pb.collection("audit_logs").create({
    actor_id: params.reviewerId,
    action: "task_created_from_review",
    entity_type: "task",
    entity_id: task.id,
    metadata: { reviewId: review.id, candidateId: candidateRecord.id }
  });

  const notifications = await createAndSendTaskCreatedNotifications({
    taskId: task.id,
    responsibleUserId: candidate.proposedResponsibleUserId!,
    requesterUserId: candidate.proposedRequesterUserId!,
    taskTitle: task.title,
    dueDate: candidate.dueDate!
  });

  return { taskId: task.id, reviewId: review.id, notifications };
}

export async function editCandidate(params: {
  candidateId: string;
  reviewerId: string;
  patch: Record<string, unknown>;
  note?: string;
}) {
  const pb = createPocketBaseClient();
  const serviceToken = process.env.POCKETBASE_SERVICE_TOKEN;
  if (serviceToken) pb.authStore.save(serviceToken, null);

  const updated = await pb.collection("task_candidates").update(params.candidateId, params.patch);

  await pb.collection("task_reviews").create({
    candidate_id: params.candidateId,
    reviewer_id: params.reviewerId,
    action: "edit",
    notes: params.note ?? "Edited in review workflow",
    reviewed_at: new Date().toISOString()
  });

  return updated;
}

export async function rejectCandidate(params: { candidateId: string; reviewerId: string; note?: string }) {
  const pb = createPocketBaseClient();
  const serviceToken = process.env.POCKETBASE_SERVICE_TOKEN;
  if (serviceToken) pb.authStore.save(serviceToken, null);

  const updated = await pb.collection("task_candidates").update(params.candidateId, {
    status: "rejected",
    validation_required: false
  });

  await pb.collection("task_reviews").create({
    candidate_id: params.candidateId,
    reviewer_id: params.reviewerId,
    action: "reject",
    notes: params.note ?? "Rejected in review workflow",
    reviewed_at: new Date().toISOString()
  });

  return updated;
}
