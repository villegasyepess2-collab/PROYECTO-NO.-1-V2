import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function transcribeAudioWithFasterWhisper(audioPath: string): Promise<{ text: string; language: string }> {
  const cmd = process.env.FASTER_WHISPER_CMD ?? "faster-whisper";
  const model = process.env.FASTER_WHISPER_MODEL ?? "small";

  const { stdout } = await execFileAsync(cmd, [audioPath, "--model", model, "--output_format", "txt"]);
  const text = stdout.trim();

  if (!text) {
    throw new Error("Transcription output is empty");
  }

  return { text, language: "en" };
}
