# Codex Operating Guide

## Mission
Build a low-cost internal platform to ingest meeting transcripts, extract structured tasks, manually validate uncertain candidates, create final tasks, and notify via Teams chatMessage.

## Current implementation scope
- Phase 1-8 baseline implemented.
- Keep enhancements incremental and aligned with V1 scope.

## Guardrails
- Task creation must require responsible, due date, and source excerpt.
- Low-confidence/ambiguous candidates must stay in review queue until resolved.
- Notifications must use Microsoft Graph `chatMessage` and persist attempt logs.
- Reminder runs must be idempotent and stop after completion.

## Docs
- `docs/architecture/api-contracts.md`
- `docs/operations/reminder-strategy.md`
- `docs/execution/test-strategy.md`
