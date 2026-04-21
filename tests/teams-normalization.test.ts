import test from "node:test";
import assert from "node:assert/strict";
import { normalizeTranscriptText } from "../lib/teams/normalization.ts";

test("normalizeTranscriptText removes extra whitespace and blank lines", () => {
  const raw = "  Speaker A:   Hello  \n\n Speaker B:   Thanks   all \n";
  const normalized = normalizeTranscriptText(raw);
  assert.equal(normalized, "Speaker A: Hello\nSpeaker B: Thanks all");
});
