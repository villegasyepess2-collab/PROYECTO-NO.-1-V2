# Product Requirements Document (V1)

## Business Problem
Task assignments in meetings are frequently lost or delayed due to unstructured notes, unclear ownership, and missing follow-up reminders.

## Primary Users
- Meeting participants (requesters/responsibles)
- Operations reviewers (manual validation queue)
- Internal managers tracking completion

## Goals
1. Convert meeting transcripts into structured task candidates.
2. Prevent bad automation via confidence/ambiguity review gate.
3. Notify stakeholders through Teams chat messages.
4. Track task lifecycle and reminders until completion.

## V1 Scope
- Internal Teams meetings with post-meeting transcript ingestion.
- In-person meeting recordings from web app, transcribed post-meeting.
- Candidate extraction with title, description, excerpt, due date, requester, responsible, confidence.
- Review queue for uncertain candidates.
- Final task creation + notifications + reminders.

## Out of Scope
- Zoom/Google Meet integrations
- Real-time meeting processing
- External meeting ingestion
- Advanced analytics and semantic global search
- Multi-tenant architecture

## Success Criteria
- ≥80% precision on auto-approved tasks in pilot.
- 100% of low-confidence/ambiguous cases routed to review.
- 95% notification delivery with retries.
- 0 final tasks created without responsible, due date, and excerpt.

## Risks
- Transcript quality variability.
- Graph permissions and tenant policy constraints.
- Inconsistent participant identity mapping.
- Local model performance under heavier loads.
