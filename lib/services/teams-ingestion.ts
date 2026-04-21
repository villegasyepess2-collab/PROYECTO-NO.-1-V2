import { createPocketBaseClient } from "@/lib/db/pocketbase";
import { normalizeTranscriptText } from "@/lib/teams/normalization";
import { fetchTeamsTranscriptContent } from "@/lib/teams/graph";
import type { TeamsIngestionRequest } from "@/lib/teams/types";

export async function ingestTeamsTranscript(input: TeamsIngestionRequest) {
  const pb = createPocketBaseClient();
  const serviceToken = process.env.POCKETBASE_SERVICE_TOKEN;

  if (serviceToken) {
    pb.authStore.save(serviceToken, null);
  }

  const transcriptPayload = input.transcriptContent
    ? {
        externalMeetingId: input.meetingExternalId,
        externalTranscriptId: input.transcriptExternalId,
        organizerAadUserId: input.organizerAadUserId,
        content: input.transcriptContent,
        language: input.language ?? "en"
      }
    : await fetchTeamsTranscriptContent({
        organizerAadUserId: input.organizerAadUserId,
        meetingExternalId: input.meetingExternalId,
        transcriptExternalId: input.transcriptExternalId
      });

  const normalizedText = normalizeTranscriptText(transcriptPayload.content);

  const meetingSource = await pb.collection("meeting_sources").create({
    source_type: "teams_internal",
    external_id: input.meetingExternalId,
    provider: "microsoft_teams"
  });

  const meeting = await pb.collection("meetings").create({
    source_id: meetingSource.id,
    external_id: input.meetingExternalId,
    title: input.meetingTitle ?? `Teams meeting ${input.meetingExternalId}`,
    organizer_aad_user_id: input.organizerAadUserId,
    started_at: input.startedAt ?? new Date().toISOString(),
    ended_at: input.endedAt ?? new Date().toISOString()
  });

  const transcript = await pb.collection("transcripts").create({
    meeting_id: meeting.id,
    external_id: input.transcriptExternalId,
    language: transcriptPayload.language,
    raw_text: transcriptPayload.content,
    normalized_text: normalizedText,
    source_kind: "teams_internal"
  });

  return {
    meetingSourceId: meetingSource.id,
    meetingId: meeting.id,
    transcriptId: transcript.id,
    normalizedLength: normalizedText.length
  };
}
