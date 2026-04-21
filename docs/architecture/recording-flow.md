# In-Person Recording Flow (Phase 4)

## Browser capture
- Use `MediaRecorder` in the web app.
- User starts and stops recording manually.
- Audio blob (`audio/webm`) is uploaded to `POST /api/meetings/inperson/upload` after stop.

## Upload and storage
1. Save recording to local server directory (`RECORDINGS_DIR`, default `/tmp/meeting-recordings`).
2. Create `meeting_sources` record with `in_person_recording`.
3. Create `meetings` record linked to the source.
4. Create `attachments` record with file metadata/path.

## Post-meeting processing
1. Run local transcription using faster-whisper CLI.
2. Create `transcripts` record with raw and normalized text.
3. Trigger Phase 5 extraction pipeline.
4. Persist `task_candidates` with review gating.

## Phase boundary
- No real-time processing.
- No reminder/notification logic in this phase.
