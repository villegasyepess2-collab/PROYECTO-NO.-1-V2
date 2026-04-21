import test from "node:test";
import assert from "node:assert/strict";
import { canCreateFinalTask, shouldRequireReview } from "../lib/domain/rules.ts";
import type { TaskCandidate } from "../lib/domain/entities.ts";

const candidate: TaskCandidate = {
  id: "cand-1",
  meetingId: "meeting-1",
  transcriptId: "transcript-1",
  title: "Prepare summary",
  description: "Please prepare the summary",
  sourceExcerpt: "Please prepare the summary by Friday",
  proposedResponsibleUserId: "user-1",
  proposedRequesterUserId: "user-2",
  dueDate: "2026-04-30",
  confidenceScore: 0.9,
  validationRequired: false,
  status: "approved",
  createdAt: new Date().toISOString()
};

test("final task guard allows complete candidate", () => {
  const result = canCreateFinalTask(candidate);
  assert.equal(result.allowed, true);
});

test("low-confidence candidate is routed to review", () => {
  const lowConfidence = { ...candidate, confidenceScore: 0.4 };
  assert.equal(shouldRequireReview(lowConfidence), true);
});
