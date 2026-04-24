# V1 Scope Definition

## Included
- Internal Teams post-meeting transcript ingestion.
- In-person meeting recording in web app with post-meeting transcription.
- Local task extraction and confidence/ambiguity routing.
- Manual validation queue for uncertain candidates.
- Final task creation with strict guard rules.
- Teams Graph `chatMessage` notifications to responsible and requester.
- Reminder scheduler, overdue logic, audit trail, comments, status history.

## Explicit Exclusions
- Real-time meeting bots/media pipelines.
- External platforms (Zoom, Google Meet, WhatsApp).
- Semantic search and advanced BI dashboards.
- Enterprise multi-tenant architecture.

## Definition of Done
- Mandatory entities modeled.
- Mandatory functional rules enforced in code.
- Mandatory docs complete and aligned.
- Core endpoints and UI pages available.
- Basic tests for critical domain rules exist.

## Phase ownership map (order-driven)
- Phase 1: docs + app structure alignment.
- Phase 2: Teams transcript ingestion (including PoC local demo transcript seed).
- Phase 3: in-person meeting capture/post-processing (PoC local mode acceptable).
- Phase 4-7: extraction, validation, notifications, reminders/tests in sequence.
