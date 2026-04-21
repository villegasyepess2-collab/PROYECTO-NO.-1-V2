import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createPocketBaseClient } from "@/lib/db/pocketbase";
import { addDemoInpersonMeeting, ensureDemoScenario, isDemoLocalMode } from "@/lib/demo/local-store";
import { storeUploadedRecording } from "@/lib/recording/storage";
import { transcribeAudioWithFasterWhisper } from "@/lib/recording/transcription";
import { runExtractionPipeline } from "@/lib/services/extraction-pipeline";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("audio");
  const meetingTitle = String(form.get("meetingTitle") ?? "In-person meeting");

  if (isDemoLocalMode()) {
    ensureDemoScenario();
    const simulated = addDemoInpersonMeeting(meetingTitle);
    return NextResponse.json({
      message: "Recording processed (demo mode simulated)",
      meetingId: simulated.meetingId,
      transcriptId: simulated.transcriptId,
      extraction: {
        created: 1,
        requiresReview: 1,
        autoApproved: 0,
        candidateIds: [simulated.candidateId]
      }
    });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "audio file is required" }, { status: 400 });
  }

  const audioBuffer = Buffer.from(await file.arrayBuffer());

  try {
    const pb = createPocketBaseClient();
    const serviceToken = process.env.POCKETBASE_SERVICE_TOKEN;
    if (serviceToken) pb.authStore.save(serviceToken, null);

    const stored = await storeUploadedRecording(file.name, audioBuffer);

    const source = await pb.collection("meeting_sources").create({
      source_type: "in_person_recording",
      provider: "web_app_recorder",
      external_id: stored.fileName
    });

    const meeting = await pb.collection("meetings").create({
      source_id: source.id,
      title: meetingTitle,
      organizer_aad_user_id: session.userId,
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString()
    });

    await pb.collection("attachments").create({
      meeting_id: meeting.id,
      file_name: stored.fileName,
      storage_path: stored.path,
      mime_type: file.type || "audio/webm",
      size_bytes: file.size
    });

    const transcription = await transcribeAudioWithFasterWhisper(stored.path);

    const transcript = await pb.collection("transcripts").create({
      meeting_id: meeting.id,
      external_id: stored.fileName,
      language: transcription.language,
      raw_text: transcription.text,
      normalized_text: transcription.text,
      source_kind: "in_person_recording"
    });

    const extraction = await runExtractionPipeline({
      meetingId: meeting.id,
      transcriptId: transcript.id,
      transcriptText: transcription.text
    });

    return NextResponse.json({
      message: "Recording uploaded, transcribed, and extracted",
      meetingId: meeting.id,
      transcriptId: transcript.id,
      extraction
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "In-person upload pipeline failed",
        detail: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 502 }
    );
  }
}
