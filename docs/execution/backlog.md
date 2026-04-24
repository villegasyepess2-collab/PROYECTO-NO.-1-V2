# Backlog

## Execution guard (must respect order)
- Do not start a phase until the previous one is functionally closed in PoC local mode.
- Current active target: Phase 2 (Teams transcript local demo), then Phase 3.

## Epic 1: Foundation
- Story: As an admin, I can log in and access dashboard/navigation.
- Story: As a developer, I can run APIs for ingestion, extraction, review, tasks, notifications.

## Epic 2: Meeting Ingestion
- Story: As an operator, I can ingest Teams transcript post-meeting.
- Story: As a user, I can upload an in-person recording after meeting ends.

## Epic 3: Extraction and Review
- Story: As a reviewer, I can see low-confidence candidates in queue.
- Story: As a reviewer, I can approve/edit/reject with audit trail.

## Epic 4: Task and Notifications
- Story: As a responsible person, I receive task assignment via Teams chat message.
- Story: As requester, I receive confirmation when task is created.

## Epic 5: Reminder and Lifecycle
- Story: As responsible user, I receive reminders before due date.
- Story: As manager, overdue tasks are marked and re-notified.

## Priorities
- P0: ingestion, extraction, review gate, task guard rules.
- P1: notifications and reminder retries.
- P2: UX and operational reporting improvements.
