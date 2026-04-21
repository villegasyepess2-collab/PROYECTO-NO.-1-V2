# System Design

## Architecture Overview
Single Next.js application serving UI and internal APIs. PocketBase is the system of record for entities, auth, and attachment storage. Local processing workers (or background jobs) run faster-whisper and Ollama extraction pipelines.

## Components
- UI: Dashboard, Meetings, Review Queue, Tasks.
- API routes: ingestion, extraction, review, task creation, notification dispatch, reminder scheduler trigger.
- Domain services: extraction rules, task guards, reminder logic.
- Integrations: Microsoft Graph transcript retrieval and `chatMessage` notifications.

## Data Flow
1. Meeting transcript/audio arrives.
2. Transcript normalized and stored.
3. Candidate sentence detection + local model extraction.
4. Confidence and ambiguity rules decide auto-approve vs review queue.
5. Approved candidate creates final task.
6. Notification service sends Teams messages to responsible + requester.
7. Scheduler sends reminders and overdue notifications.

## Teams Ingestion Flow
- Meeting metadata imported.
- Transcript fetched post-meeting via Graph APIs.
- Transcript parsed to normalized internal structure.
- Linked to `meetings` and `meeting_sources` records.

## Task Lifecycle
- pending → in_progress → blocked → completed
- pending/in_progress/blocked become overdue when due date passes.
- completion stops reminders.

## Notification Flow
- Create notification records by event (`task_created`, `reminder_due`, `overdue`).
- Attempt send via Graph `chatMessage`.
- Persist notification attempts with status/error.
- Retry failed sends with backoff and idempotency key.

## Trade-offs
- Monolith over microservices for lower ops cost.
- Post-meeting processing over real-time for simplicity and reliability.
- Local models over paid APIs to control cost at moderate quality constraints.
