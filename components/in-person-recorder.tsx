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

export function InPersonRecorder() {
  const [recording, setRecording] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("In-person meeting");
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
        if (!response.ok) throw new Error(payload.detail ?? payload.error ?? "Upload failed");

        setResult(payload);
        setStatus("processed");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
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
            "In this in-person planning, Lucía asked Pedro to finish the deployment checklist by Friday and confirm pending approvals."
        })
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail ?? payload.error ?? "Demo load failed");

      setResult(payload);
      setStatus("demo_ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Demo load failed");
      setStatus("error");
    }
  };

  const stop = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="card">
      <h3>In-person Recording Flow</h3>
      <label htmlFor="meetingTitle">Meeting title</label>
      <input id="meetingTitle" value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} />
      <p>Status: <span className="code">{status}</span></p>
      <button onClick={loadInPersonDemo} disabled={recording} style={{ marginRight: 8 }}>
        Load in-person demo recording
      </button>
      {!recording ? <button onClick={start}>Start recording</button> : <button onClick={stop}>Stop recording</button>}
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
      {result ? (
        <ul>
          {result.sourceKind ? <li>Source kind: <span className="code">{result.sourceKind}</span></li> : null}
          <li>Meeting: <span className="code">{result.meetingId}</span></li>
          <li>Transcript: <span className="code">{result.transcriptId}</span></li>
          {typeof result.transcriptLength === "number" ? <li>Transcript length: {result.transcriptLength}</li> : null}
          {result.extraction ? <li>Candidates: {result.extraction.created}</li> : null}
          {result.extraction ? <li>Requires review: {result.extraction.requiresReview}</li> : null}
        </ul>
      ) : null}
    </div>
  );
}
