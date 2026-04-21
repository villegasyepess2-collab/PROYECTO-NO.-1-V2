import type { TaskCandidate } from "@/lib/domain/entities";
import { shouldRequireReview } from "@/lib/domain/rules";
import { ollamaGenerate } from "@/lib/ai/ollama";

const triggerPatterns = [
  /\b(i ask|i request|i need you to|please take care of|you are responsible for|you need to)\b/i
];

export function detectTaskCandidateSentences(transcriptText: string): string[] {
  return transcriptText
    .split(/[.!?\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((sentence) => triggerPatterns.some((pattern) => pattern.test(sentence)));
}

async function extractWithOllama(sentence: string): Promise<Partial<TaskCandidate>> {
  const prompt = [
    "Extract a task assignment from this sentence.",
    "Return strict JSON with keys:",
    "title,description,sourceExcerpt,proposedResponsibleUserId,proposedRequesterUserId,dueDate,confidenceScore,ambiguityReasons.",
    `Sentence: ${sentence}`
  ].join("\n");

  try {
    const output = await ollamaGenerate({ prompt });
    const jsonStart = output.indexOf("{");
    const jsonEnd = output.lastIndexOf("}");

    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("No JSON found in Ollama output");
    }

    const parsed = JSON.parse(output.slice(jsonStart, jsonEnd + 1)) as Partial<TaskCandidate>;
    return parsed;
  } catch {
    return {
      title: sentence.slice(0, 60),
      description: sentence,
      sourceExcerpt: sentence,
      confidenceScore: 0.55,
      ambiguityReasons: ["model_fallback"]
    };
  }
}

export async function extractTaskCandidates(params: {
  meetingId: string;
  transcriptId: string;
  transcriptText: string;
}): Promise<TaskCandidate[]> {
  const sentences = detectTaskCandidateSentences(params.transcriptText);

  const candidates = await Promise.all(
    sentences.map(async (sentence, index) => {
      const partial = await extractWithOllama(sentence);
      const candidate: TaskCandidate = {
        id: `${params.transcriptId}-candidate-${index + 1}`,
        meetingId: params.meetingId,
        transcriptId: params.transcriptId,
        title: partial.title ?? sentence.slice(0, 60),
        description: partial.description ?? sentence,
        sourceExcerpt: partial.sourceExcerpt ?? sentence,
        proposedResponsibleUserId: partial.proposedResponsibleUserId,
        proposedRequesterUserId: partial.proposedRequesterUserId,
        dueDate: partial.dueDate,
        confidenceScore: typeof partial.confidenceScore === "number" ? partial.confidenceScore : 0.55,
        validationRequired: false,
        status: "pending",
        ambiguityReasons: partial.ambiguityReasons,
        createdAt: new Date().toISOString()
      };

      const requiresReview = shouldRequireReview(candidate);
      return {
        ...candidate,
        validationRequired: requiresReview,
        status: requiresReview ? "requires_review" : "approved"
      };
    })
  );

  return candidates;
}
