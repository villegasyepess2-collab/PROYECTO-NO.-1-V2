# Reminder Strategy (Phase 8)

## Trigger
- Scheduler endpoint: `POST /api/reminders/run`.
- Can be executed by cron or manually from internal UI.

## Rules
- Send due reminders when days-to-due matches configured offsets (`REMINDER_DAYS_BEFORE`, default `3,1`).
- Mark task status as `overdue` when due date is in the past and task is not completed.
- Send overdue reminders daily using idempotency key `<taskId>:overdue_reminder:<date>`.
- Stop reminders when task status is `completed`.

## Retry and idempotency
- Notification delivery retries up to 3 attempts.
- Each reminder has deterministic idempotency key to prevent duplicate sends.
- Delivery attempts are stored in `notification_attempts`.
