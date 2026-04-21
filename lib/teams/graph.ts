import type { TeamsTranscriptPayload } from "@/lib/teams/types";

export async function fetchTeamsTranscriptContent(params: {
  organizerAadUserId: string;
  meetingExternalId: string;
  transcriptExternalId: string;
}): Promise<TeamsTranscriptPayload> {
  const token = process.env.MS_GRAPH_TOKEN;

  if (!token) {
    throw new Error("MS_GRAPH_TOKEN is required for Teams transcript ingestion");
  }

  const url = `https://graph.microsoft.com/v1.0/users/${params.organizerAadUserId}/onlineMeetings/${params.meetingExternalId}/transcripts/${params.transcriptExternalId}/content`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Graph transcript fetch failed with status ${response.status}`);
  }

  const content = await response.text();

  return {
    externalMeetingId: params.meetingExternalId,
    externalTranscriptId: params.transcriptExternalId,
    organizerAadUserId: params.organizerAadUserId,
    language: "en",
    content
  };
}
