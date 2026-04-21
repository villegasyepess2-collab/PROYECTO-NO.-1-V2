# Meeting Task Extraction Platform (V1)

Internal web app for meeting task extraction and follow-up.

## Current status
- ✅ Phase 1-5 complete.
- ✅ Phase 6 complete: manual review queue with approve/edit/reject actions.
- ✅ Phase 7 complete: final task creation and Graph `chatMessage` notifications.
- ✅ Phase 8 complete: task status flow, reminder scheduler, overdue logic, delivery attempts, audit/status history hooks.

## Key APIs
- Auth: `POST /api/auth/login`, `POST /api/auth/logout`
- Ingestion: `POST /api/meetings/teams/ingest`, `POST /api/meetings/inperson/upload`
- Extraction: `POST /api/extraction/run`
- Review: `GET /api/reviews`, `POST /api/reviews/{candidateId}/approve|edit|reject`
- Tasks: `POST /api/tasks/{taskId}/status`
- Reminders: `POST /api/reminders/run`

## Runtime dependencies
- PocketBase
- Microsoft Graph token (`MS_GRAPH_TOKEN`) with access to Teams chatMessage APIs
- faster-whisper CLI
- Ollama local server

## Run
1. `npm install`
2. configure env vars
3. `npm run dev`
4. `npm test`
