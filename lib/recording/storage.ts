import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export async function storeUploadedRecording(fileName: string, bytes: Uint8Array) {
  const root = process.env.RECORDINGS_DIR ?? "/tmp/meeting-recordings";
  await mkdir(root, { recursive: true });
  const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const fullPath = join(root, safeName);
  await writeFile(fullPath, bytes);
  return { path: fullPath, fileName: safeName };
}
