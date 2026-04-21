"use client";

import { FormEvent, useState } from "react";
import { InPersonRecorder } from "@/components/in-person-recorder";

interface TeamsIngestionResult {
  message: string;
  meetingSourceId: string;
  meetingId: string;
  transcriptId: string;
  normalizedLength: number;
}

export default function MeetingsPage() {
  const [teamsResult, setTeamsResult] = useState<TeamsIngestionResult | null>(null);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onTeamsSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setTeamsError(null);
    setTeamsResult(null);

    const form = new FormData(event.currentTarget);

    const response = await fetch("/api/meetings/teams/ingest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        meetingExternalId: form.get("meetingExternalId"),
        organizerAadUserId: form.get("organizerAadUserId"),
        transcriptExternalId: form.get("transcriptExternalId"),
        meetingTitle: form.get("meetingTitle"),
        transcriptContent: form.get("transcriptContent")
      })
    });

    const body = await response.json();

    if (!response.ok) {
      setTeamsError(body.detail ?? body.error ?? "Ingestion failed");
      setPending(false);
      return;
    }

    setTeamsResult(body);
    setPending(false);
  };

  return (
    <section>
      <div className="card">
        <h3>Teams Transcript Ingestion (Phase 3)</h3>
        <form onSubmit={onTeamsSubmit} style={{ display: "grid", gap: 8, marginTop: 12 }}>
          <label htmlFor="meetingExternalId">Meeting external ID</label>
          <input id="meetingExternalId" name="meetingExternalId" required />

          <label htmlFor="organizerAadUserId">Organizer AAD user ID</label>
          <input id="organizerAadUserId" name="organizerAadUserId" required />

          <label htmlFor="transcriptExternalId">Transcript external ID</label>
          <input id="transcriptExternalId" name="transcriptExternalId" required />

          <label htmlFor="meetingTitle">Meeting title (optional)</label>
          <input id="meetingTitle" name="meetingTitle" />

          <label htmlFor="transcriptContent">Transcript text override (optional)</label>
          <textarea id="transcriptContent" name="transcriptContent" rows={5} />

          <button type="submit" disabled={pending}>{pending ? "Ingesting..." : "Ingest transcript"}</button>
        </form>

        {teamsError ? <p style={{ color: "#b91c1c" }}>{teamsError}</p> : null}
        {teamsResult ? (
          <ul>
            <li>Meeting source: <span className="code">{teamsResult.meetingSourceId}</span></li>
            <li>Meeting: <span className="code">{teamsResult.meetingId}</span></li>
            <li>Transcript: <span className="code">{teamsResult.transcriptId}</span></li>
            <li>Normalized chars: {teamsResult.normalizedLength}</li>
          </ul>
        ) : null}
      </div>

      <InPersonRecorder />
    </section>
  );
}
