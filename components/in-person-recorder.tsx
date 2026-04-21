"use client";

import { useRef, useState } from "react";

interface UploadResult {
  message: string;
  meetingId: string;
  transcriptId: string;
  extraction: {
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
      {!recording ? <button onClick={start}>Start recording</button> : <button onClick={stop}>Stop recording</button>}
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
      {result ? (
        <ul>
          <li>Meeting: <span className="code">{result.meetingId}</span></li>
          <li>Transcript: <span className="code">{result.transcriptId}</span></li>
          <li>Candidates: {result.extraction.created}</li>
          <li>Requires review: {result.extraction.requiresReview}</li>
        </ul>
      ) : null}
    </div>
  );
}
