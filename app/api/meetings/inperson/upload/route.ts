import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createPocketBaseClient } from "@/lib/db/pocketbase";
import { addDemoInpersonMeeting, isDemoLocalMode } from "@/lib/demo/local-store";
import { storeUploadedRecording } from "@/lib/recording/storage";
import { transcribeAudioWithFasterWhisper } from "@/lib/recording/transcription";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("audio");
  const meetingTitle = String(form.get("meetingTitle") ?? "Reunión presencial");

  if (isDemoLocalMode()) {
    const simulated = addDemoInpersonMeeting({
      meetingTitle,
      organizerUserId: session.userId
    });
    return NextResponse.json({
      message: "Grabación procesada (modo demo simulado)",
      sourceKind: simulated.sourceKind,
      meetingId: simulated.meetingId,
      transcriptId: simulated.transcriptId,
      transcriptLength: simulated.transcriptLength
    });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "El archivo de audio es obligatorio" }, { status: 400 });
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

    return NextResponse.json({
      message: "Grabación cargada y transcrita",
      sourceKind: "in_person_recording",
      meetingId: meeting.id,
      transcriptId: transcript.id,
      transcriptLength: transcription.text.length
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Error en el flujo de carga presencial",
        detail: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 502 }
    );
  }
}
