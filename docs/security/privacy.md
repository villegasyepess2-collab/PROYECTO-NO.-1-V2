# Security and Privacy

## Authentication Model
- First-party login handled by PocketBase auth.
- Session token stored in secure, HTTP-only cookie.

## Access Rules
- Users view only meetings/tasks where they are participant/requester/responsible unless admin.
- Review queue only for reviewer/admin roles.

## Audit Logging
- Log all key actions: ingestion, extraction, review, task creation, status transitions, notifications.
- Include actor, timestamp, source IP, and entity IDs.

## Transcript Storage Policy
- Store raw and normalized transcript with role-based access.
- Set retention window for transcripts and recording artifacts.
- Encrypt storage at rest (PocketBase host-level configuration).

## Recording Access Policy
- Only meeting participants and authorized reviewers can access recordings.
- Download disabled by default in pilot unless explicit admin policy allows.
