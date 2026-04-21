# API Contracts (Current: Phase 8)

## Auth APIs
- `POST /api/auth/login`
- `POST /api/auth/logout`

## Meetings APIs
- `POST /api/meetings/teams/ingest`
- `POST /api/meetings/inperson/upload`

## Extraction API
- `POST /api/extraction/run`

## Review APIs
- `GET /api/reviews`
- `POST /api/reviews/{candidateId}/approve`
- `POST /api/reviews/{candidateId}/edit`
- `POST /api/reviews/{candidateId}/reject`

Approve request must include:
- `responsibleUserId`
- `requesterUserId`
- `dueDate`

## Task APIs
- `POST /api/tasks/{taskId}/status`
  - allowed status: `pending`, `in_progress`, `blocked`, `overdue`, `completed`

## Reminder API
- `POST /api/reminders/run`

## Notification behavior
- Task creation from approved candidate triggers Graph `chatMessage` to:
  - responsible user
  - requester
- Reminders and overdue notifications also use Graph `chatMessage`.
- Delivery attempts are persisted for retry/failure audit.
