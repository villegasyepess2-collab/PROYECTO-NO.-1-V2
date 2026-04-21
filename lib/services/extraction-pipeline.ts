import { createPocketBaseClient } from "@/lib/db/pocketbase";
import { extractTaskCandidates } from "@/lib/ai/extraction";

export async function runExtractionPipeline(params: {
  meetingId: string;
  transcriptId: string;
  transcriptText: string;
}) {
  const pb = createPocketBaseClient();
  const serviceToken = process.env.POCKETBASE_SERVICE_TOKEN;

  if (serviceToken) pb.authStore.save(serviceToken, null);

  const candidates = await extractTaskCandidates(params);

  const persisted = await Promise.all(
    candidates.map((candidate) =>
      pb.collection("task_candidates").create({
        meeting_id: candidate.meetingId,
        transcript_id: candidate.transcriptId,
        title: candidate.title,
        description: candidate.description,
        source_excerpt: candidate.sourceExcerpt,
        proposed_responsible_user_id: candidate.proposedResponsibleUserId,
        proposed_requester_user_id: candidate.proposedRequesterUserId,
        due_date: candidate.dueDate,
        confidence_score: candidate.confidenceScore,
        validation_required: candidate.validationRequired,
        status: candidate.status,
        ambiguity_reasons: candidate.ambiguityReasons ?? []
      })
    )
  );

  return {
    created: persisted.length,
    requiresReview: persisted.filter((record) => record.validation_required).length,
    autoApproved: persisted.filter((record) => !record.validation_required).length,
    candidateIds: persisted.map((record) => record.id)
  };
}
