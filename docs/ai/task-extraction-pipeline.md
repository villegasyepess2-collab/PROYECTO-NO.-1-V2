# Task Extraction Pipeline (Phase 5)

## Inputs
- Transcript text from Teams ingestion or in-person transcription.

## Step 1: Trigger sentence detection
Detect candidate assignment sentences using required phrase patterns and semantic variants:
- "I ask"
- "I request"
- "I need you to"
- "please take care of"
- "you are responsible for"
- "you need to"

## Step 2: Ollama structured extraction
- Send candidate sentence to Ollama local endpoint.
- Request strict JSON extraction for:
  - title
  - description
  - sourceExcerpt
  - proposedResponsibleUserId
  - proposedRequesterUserId
  - dueDate
  - confidenceScore
  - ambiguityReasons

## Step 3: Confidence and ambiguity routing
Apply review guard rules:
- low confidence
- missing/ambiguous responsible
- missing/ambiguous due date

When guard fails:
- set `validation_required=true`
- set status `requires_review`
- keep candidate in manual review queue

## Phase boundary
- Do not auto-create tasks in this phase.
- Do not send notifications in this phase.
