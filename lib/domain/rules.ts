import type { Task, TaskCandidate } from "./entities.ts";

export const CONFIDENCE_THRESHOLD = 0.75;

export function shouldRequireReview(candidate: TaskCandidate): boolean {
  const dueDateMissing = !candidate.dueDate;
  const responsibleMissing = !candidate.proposedResponsibleUserId;
  const ambiguousResponsible = (candidate.ambiguityReasons ?? []).includes("multiple_responsible_candidates");
  const ambiguousDate = (candidate.ambiguityReasons ?? []).includes("ambiguous_due_date");
  const lowConfidence = candidate.confidenceScore < CONFIDENCE_THRESHOLD;

  return dueDateMissing || responsibleMissing || ambiguousResponsible || ambiguousDate || lowConfidence;
}

export function canCreateFinalTask(candidate: TaskCandidate): { allowed: boolean; reason?: string } {
  if (!candidate.proposedResponsibleUserId) return { allowed: false, reason: "Responsible person is required" };
  if (!candidate.dueDate) return { allowed: false, reason: "Due date is required" };
  if (!candidate.sourceExcerpt.trim()) return { allowed: false, reason: "Source excerpt is required" };
  if (shouldRequireReview(candidate)) return { allowed: false, reason: "Candidate requires review" };
  return { allowed: true };
}

export function shouldStopReminders(task: Task): boolean {
  return task.status === "completed";
}
