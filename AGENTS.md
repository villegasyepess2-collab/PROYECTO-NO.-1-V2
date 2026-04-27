# Codex Operating Guide

## Mission
Build a low-cost internal platform to ingest meeting transcripts, extract structured tasks, manually validate uncertain candidates, create final tasks, and notify via Teams chatMessage.

## Current implementation scope
- Order-driven delivery required by phase:
  1) documentation/base app,
  2) Teams transcript,
  3) in-person recording,
  4) AI extraction,
  5) validation,
  6) Graph `chatMessage`,
  7) reminders/tests.
- For current iteration, close Phase 4 before advancing to Phase 5.

## Guardrails
- Task creation must require responsible, due date, and source excerpt.
- Low-confidence/ambiguous candidates must stay in review queue until resolved.
- Notifications must use Microsoft Graph `chatMessage` and persist attempt logs.
- Reminder runs must be idempotent and stop after completion.

## Docs
- `docs/architecture/api-contracts.md`
- `docs/operations/reminder-strategy.md`
- `docs/execution/test-strategy.md`
