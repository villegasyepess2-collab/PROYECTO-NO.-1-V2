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
        meetingTitle: "Demo semanal de operaciones en Teams",
        transcriptText:
          "Le pido a Ana finalizar el informe semanal para el próximo martes y confirmar la lista de bloqueos."
      })
    });
    const payload = await response.json();

    if (!response.ok) {
      setTeamsError(payload.detail ?? payload.error ?? "No se pudo cargar la transcripción demo de Teams");
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
      setTeamsError(body.detail ?? body.error ?? "La carga de transcripción falló");
      setPending(false);
      return;
    }

    setTeamsResult(body);
    setPending(false);
  };

  return (
    <section>
      <div className="card">
        <h3>Demo de transcripción de Teams (Fase 2)</h3>
        <p>Primero carga una transcripción demo de Teams en local (sin Teams real, sin Graph, sin IDs reales).</p>
        <button onClick={loadTeamsDemoTranscript} disabled={seedPending}>
          {seedPending ? "Cargando demo de Teams..." : "Cargar transcripción demo de Teams"}
        </button>
        {teamsDemoResult ? (
          <ul>
            <li>Tipo de origen: <span className="code">{teamsDemoResult.sourceKind}</span></li>
            <li>Reunión: <span className="code">{teamsDemoResult.meetingId}</span></li>
            <li>Transcripción: <span className="code">{teamsDemoResult.transcriptId}</span></li>
            <li>Reunión externa: <span className="code">{teamsDemoResult.meetingExternalId}</span></li>
            <li>Transcripción externa: <span className="code">{teamsDemoResult.transcriptExternalId}</span></li>
            <li>Longitud de transcripción: {teamsDemoResult.transcriptLength}</li>
          </ul>
        ) : null}

        <h4 style={{ marginTop: 16 }}>Avanzado: carga manual de payload de Teams</h4>
        <form onSubmit={onTeamsSubmit} style={{ display: "grid", gap: 8, marginTop: 12 }}>
          <label htmlFor="meetingExternalId">ID externo de la reunión</label>
          <input id="meetingExternalId" name="meetingExternalId" defaultValue="demo-meeting-external-001" required />

          <label htmlFor="organizerAadUserId">ID AAD del organizador</label>
          <input id="organizerAadUserId" name="organizerAadUserId" defaultValue="demo-organizer-aad-001" required />

          <label htmlFor="transcriptExternalId">ID externo de la transcripción</label>
          <input id="transcriptExternalId" name="transcriptExternalId" defaultValue="demo-transcript-ext-001" required />

          <label htmlFor="meetingTitle">Título de la reunión (opcional)</label>
          <input id="meetingTitle" name="meetingTitle" />

          <label htmlFor="transcriptContent">Texto de transcripción personalizado (opcional)</label>
          <textarea id="transcriptContent" name="transcriptContent" rows={5} />

          <button type="submit" disabled={pending}>{pending ? "Cargando..." : "Cargar transcripción"}</button>
        </form>

        {teamsError ? <p style={{ color: "#b91c1c" }}>{teamsError}</p> : null}
        {teamsResult ? (
          <ul>
            <li>Origen de reunión: <span className="code">{teamsResult.meetingSourceId}</span></li>
            <li>Reunión: <span className="code">{teamsResult.meetingId}</span></li>
            <li>Transcripción: <span className="code">{teamsResult.transcriptId}</span></li>
            <li>Caracteres normalizados: {teamsResult.normalizedLength}</li>
          </ul>
        ) : null}
      </div>

      <InPersonRecorder />
    </section>
  );
}
