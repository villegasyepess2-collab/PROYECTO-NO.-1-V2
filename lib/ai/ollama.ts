export async function ollamaGenerate(params: { prompt: string; model?: string }): Promise<string> {
  const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
  const model = params.model ?? process.env.OLLAMA_MODEL ?? "llama3.1:8b";

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ model, prompt: params.prompt, stream: false })
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as { response?: string };
  return payload.response?.trim() ?? "";
}
