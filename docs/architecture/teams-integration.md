# Teams Integration (Phase 3)

## Scope implemented now
- Post-meeting transcript ingestion endpoint: `POST /api/meetings/teams/ingest`.
- Transcript retrieval from Microsoft Graph when transcript text is not provided directly.
- Persist normalized transcript records linked to meeting source and meeting.

## Request contract
```json
{
  "meetingExternalId": "string",
  "organizerAadUserId": "string",
  "transcriptExternalId": "string",
  "meetingTitle": "optional string",
  "transcriptContent": "optional string"
}
```

## Graph flow (minimal)
1. Use `MS_GRAPH_TOKEN` application token.
2. Call:
   `GET /users/{organizerAadUserId}/onlineMeetings/{meetingExternalId}/transcripts/{transcriptExternalId}/content`
3. Receive transcript text and normalize line-by-line.

## Persistence flow
Creates records in this order:
1. `meeting_sources` (type `teams_internal`)
2. `meetings`
3. `transcripts` (raw + normalized text)

## Not implemented in this phase
- Real-time bots/media
- Extraction pipeline trigger
- Notifications
- Retry orchestration beyond API error return
