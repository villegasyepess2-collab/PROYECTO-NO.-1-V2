export interface TeamsIngestionRequest {
  meetingExternalId: string;
  organizerAadUserId: string;
  transcriptExternalId: string;
  transcriptContent?: string;
  meetingTitle?: string;
  startedAt?: string;
  endedAt?: string;
  language?: string;
}

export interface TeamsTranscriptPayload {
  externalMeetingId: string;
  externalTranscriptId: string;
  organizerAadUserId: string;
  content: string;
  language: string;
}
