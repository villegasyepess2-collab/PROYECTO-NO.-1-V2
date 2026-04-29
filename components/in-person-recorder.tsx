"use client";

import { useRef, useState } from "react";

interface UploadResult {
  message: string;
  sourceKind?: "in_person_recording";
  meetingId: string;
  transcriptId: string;
  transcriptLength?: number;
  extraction?: {
    created: number;
    requiresReview: number;
    autoApproved: number;
  };
}

const recorderStatusLabel: Record<string, string> = {
  idle: "inactivo",
  recording: "grabando",
  uploading: "cargando",
  processed: "procesado",
  seeding_demo: "cargando_demo",
  demo_ready: "demo_lista",
  error: "error"
};

export function InPersonRecorder() {
  const [recording, setRecording] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("Reunión presencial");
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const chunksRef = useRef<Blob[]>([]);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const start = async () => {
    setError(null);
    setResult(null);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = async () => {
      try {
        setStatus("uploading");
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", audioBlob, `recording-${Date.now()}.webm`);
        formData.append("meetingTitle", meetingTitle);

        const response = await fetch("/api/meetings/inperson/upload", {
          method: "POST",
          body: formData
        });

        const payload = await response.json();
        if (!response.ok) throw new Error(payload.detail ?? payload.error ?? "Error al cargar");

        setResult(payload);
        setStatus("processed");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar");
        setStatus("error");
      }
    };

    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);
    setStatus("recording");
  };

  const loadInPersonDemo = async () => {
    try {
      setStatus("seeding_demo");
      setResult(null);
      setError(null);

      const response = await fetch("/api/demo/seed-inperson", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          meetingTitle,
          transcriptText:
            "En esta planificación presencial, Lucía pidió a Pedro completar la lista de despliegue para el viernes y confirmar aprobaciones pendientes."
        })
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail ?? payload.error ?? "Error al cargar la demo");

      setResult(payload);
      setStatus("demo_ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar la demo");
      setStatus("error");
    }
  };

  const stop = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="card">
      <h3>Flujo de grabación presencial</h3>
      <label htmlFor="meetingTitle">Título de la reunión</label>
      <input id="meetingTitle" value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} />
      <p>Estado: <span className="code">{recorderStatusLabel[status] ?? status}</span></p>
      <button onClick={loadInPersonDemo} disabled={recording} style={{ marginRight: 8 }}>
        Cargar grabación demo presencial
      </button>
      {!recording ? <button onClick={start}>Iniciar grabación</button> : <button onClick={stop}>Detener grabación</button>}
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
      {result ? (
        <ul>
          {result.sourceKind ? <li>Tipo de origen: <span className="code">{result.sourceKind}</span></li> : null}
          <li>Reunión: <span className="code">{result.meetingId}</span></li>
          <li>Transcripción: <span className="code">{result.transcriptId}</span></li>
          {typeof result.transcriptLength === "number" ? <li>Longitud de transcripción: {result.transcriptLength}</li> : null}
          {result.extraction ? <li>Candidatos: {result.extraction.created}</li> : null}
          {result.extraction ? <li>Requieren revisión: {result.extraction.requiresReview}</li> : null}
        </ul>
      ) : null}
    </div>
  );
}
