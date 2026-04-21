export function normalizeTranscriptText(rawText: string): string {
  return rawText
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}
