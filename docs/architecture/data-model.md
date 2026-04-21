# Data Model

## Entities (Mandatory)
- users
- meetings
- meeting_sources
- transcripts
- task_candidates
- task_reviews
- tasks
- task_comments
- task_status_history
- notifications
- notification_attempts
- audit_logs
- attachments

## Key Fields
- `task_candidates`: title, description, source_excerpt, proposed_responsible_user_id, proposed_requester_user_id, due_date, confidence_score, validation_required.
- `tasks`: meeting_id, task_candidate_id, responsible_user_id, requester_user_id, due_date, status, source_excerpt.
- `task_reviews`: candidate_id, reviewer_id, action (approve/edit/reject), reviewed_at, notes.
- `notifications`: task_id, user_id, type, status, idempotency_key.
- `notification_attempts`: notification_id, attempt_no, provider (`graph_chatmessage`), success, error_code, raw_response.

## Relationships
- meeting_sources 1:N meetings
- meetings 1:N transcripts
- transcripts 1:N task_candidates
- task_candidates 1:N task_reviews
- task_candidates 0..1 tasks
- tasks 1:N task_comments / task_status_history / notifications
- notifications 1:N notification_attempts

## Validation Rules
1. Task creation requires responsible_user_id + due_date + source_excerpt.
2. confidence_score below threshold forces `validation_required=true`.
3. missing/ambiguous responsible or due date forces review.

## Audit Requirements
- Immutable audit log entry for creation/update/review/status/notification actions.
- Store actor, timestamp, entity, change summary, and request correlation ID.
