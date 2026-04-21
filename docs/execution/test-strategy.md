# Test Strategy

## Unit tests
- Domain guard tests (`canCreateFinalTask`, `shouldRequireReview`).
- Transcript normalization tests.
- Reminder rule tests (offset parsing, due/overdue decisions).

## Critical flow integration tests (target)
1. Review approve -> final task creation -> task status history + audit log.
2. Task creation -> notifications to responsible and requester with attempt logs.
3. Reminder scheduler -> due reminder and overdue marking path.

## Manual validation scenarios
- Candidate with missing due date must be blocked from task creation until reviewer sets due date.
- Candidate with missing responsible must be blocked until reviewer sets responsible.
- Re-running reminders in same day should not duplicate notifications (idempotency key).
