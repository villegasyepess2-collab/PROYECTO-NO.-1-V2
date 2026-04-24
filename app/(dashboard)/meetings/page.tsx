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

interface TeamsDemoSeedResult {
  message: string;
  sourceKind: "teams_internal";
  meetingId: string;
  transcriptId: string;
  meetingExternalId: string;
  transcriptExternalId: string;
  transcriptLength: number;
}

export default function MeetingsPage() {
  const [teamsResult, setTeamsResult] = useState<TeamsIngestionResult | null>(null);
  const [teamsDemoResult, setTeamsDemoResult] = useState<TeamsDemoSeedResult | null>(null);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [seedPending, setSeedPending] = useState(false);

  const loadTeamsDemoTranscript = async () => {
    setSeedPending(true);
    setTeamsError(null);
    setTeamsDemoResult(null);

    const response = await fetch("/api/demo/seed-teams", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        meetingTitle: "Teams Weekly Operations Demo",
        transcriptText:
          "I ask Ana to finalize the weekly report by next Tuesday, and please take care of confirming the blockers list."
      })
    });
    const payload = await response.json();

    if (!response.ok) {
      setTeamsError(payload.detail ?? payload.error ?? "Unable to load Teams demo transcript");
      setSeedPending(false);
      return;
    }

    setTeamsDemoResult(payload);
    setSeedPending(false);
  };

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
        <h3>Teams Transcript Demo (Fase 2)</h3>
        <p>Primero carga un transcript Teams demo local (sin Teams real, sin Graph, sin IDs reales).</p>
        <button onClick={loadTeamsDemoTranscript} disabled={seedPending}>
          {seedPending ? "Loading Teams demo..." : "Load Teams demo transcript"}
        </button>
        {teamsDemoResult ? (
          <ul>
            <li>Source kind: <span className="code">{teamsDemoResult.sourceKind}</span></li>
            <li>Meeting: <span className="code">{teamsDemoResult.meetingId}</span></li>
            <li>Transcript: <span className="code">{teamsDemoResult.transcriptId}</span></li>
            <li>Meeting external: <span className="code">{teamsDemoResult.meetingExternalId}</span></li>
            <li>Transcript external: <span className="code">{teamsDemoResult.transcriptExternalId}</span></li>
            <li>Transcript length: {teamsDemoResult.transcriptLength}</li>
          </ul>
        ) : null}

        <h4 style={{ marginTop: 16 }}>Advanced: manual Teams ingestion payload</h4>
        <form onSubmit={onTeamsSubmit} style={{ display: "grid", gap: 8, marginTop: 12 }}>
          <label htmlFor="meetingExternalId">Meeting external ID</label>
          <input id="meetingExternalId" name="meetingExternalId" defaultValue="demo-meeting-external-001" required />

          <label htmlFor="organizerAadUserId">Organizer AAD user ID</label>
          <input id="organizerAadUserId" name="organizerAadUserId" defaultValue="demo-organizer-aad-001" required />

          <label htmlFor="transcriptExternalId">Transcript external ID</label>
          <input id="transcriptExternalId" name="transcriptExternalId" defaultValue="demo-transcript-ext-001" required />

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
