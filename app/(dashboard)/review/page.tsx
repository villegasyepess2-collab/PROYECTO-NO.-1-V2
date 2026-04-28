"use client";

import { FormEvent, useEffect, useState } from "react";

interface ReviewItem {
  id: string;
  title: string;
  source_excerpt: string;
  confidence_score: number;
  proposed_responsible_user_id?: string;
  proposed_requester_user_id?: string;
  due_date?: string;
  ambiguity_reasons?: string[];
}

export default function ReviewQueuePage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/reviews");
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(payload.detail ?? payload.error ?? "Unable to load queue");
      setLoading(false);
      return;
    }

    setItems(payload.items ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Unknown error"));
  }, []);

  const seedTeamsAndLoad = async () => {
    setError(null);
    const response = await fetch("/api/demo/seed-teams", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        meetingTitle: "Teams Demo for Review Queue",
        transcriptText:
          "I request that Carla prepare the release summary by Friday. Please take care of sharing it with support."
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.detail ?? payload.error ?? "Unable to seed Teams demo");
      return;
    }

    setMessage(`Teams demo seeded: ${payload.meetingId}`);
    await load();
  };

  const seedInPersonAndLoad = async () => {
    setError(null);
    const response = await fetch("/api/demo/seed-inperson", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        meetingTitle: "In-person Demo for Review Queue",
        transcriptText:
          "In this in-person follow-up, Maria asked Diego to deliver the pilot rollout checklist by next Thursday."
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.detail ?? payload.error ?? "Unable to seed in-person demo");
      return;
    }

    setMessage(`In-person demo seeded: ${payload.meetingId}`);
    await load();
  };

  const editCandidate = async (form: FormData, candidateId: string) => {
    setPendingId(candidateId);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/reviews/${candidateId}/edit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        patch: {
          title: form.get("title"),
          proposed_responsible_user_id: form.get("responsibleUserId"),
          due_date: form.get("dueDate")
        },
        note: "Edited in PoC review"
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.detail ?? payload.error ?? "Edit failed");
      setPendingId(null);
      return;
    }

    setMessage(`Candidate updated: ${payload.id}`);
    await load();
    setPendingId(null);
  };

  const approveCandidate = async (event: FormEvent<HTMLFormElement>, candidateId: string) => {
    event.preventDefault();
    setPendingId(candidateId);
    setError(null);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/reviews/${candidateId}/approve`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        responsibleUserId: form.get("responsibleUserId"),
        requesterUserId: form.get("requesterUserId") || "demo.requester",
        dueDate: form.get("dueDate"),
        note: "Approved in PoC review"
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.detail ?? payload.error ?? "Approve failed");
      setPendingId(null);
      return;
    }

    setMessage(`Task created: ${payload.taskId}`);
    await load();
    setPendingId(null);
  };

  const rejectCandidate = async (candidateId: string) => {
    setPendingId(candidateId);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/reviews/${candidateId}/reject`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ note: "Rejected in PoC review" })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.detail ?? payload.error ?? "Reject failed");
      setPendingId(null);
      return;
    }

    setMessage(`Candidate rejected: ${payload.id}`);
    await load();
    setPendingId(null);
  };

  return (
    <div className="card">
      <h3>Manual Review Queue</h3>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button onClick={seedTeamsAndLoad}>Seed Teams candidates</button>
        <button onClick={seedInPersonAndLoad}>Seed in-person candidates</button>
        <button onClick={load} disabled={loading}>{loading ? "Refreshing..." : "Refresh queue"}</button>
      </div>
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
      {message ? <p style={{ color: "#065f46" }}>{message}</p> : null}

      {items.length === 0 ? (
        <p>No candidates waiting for review.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id} style={{ marginBottom: 20 }}>
              <strong>{item.title}</strong> — confidence {item.confidence_score}
              <div>{item.source_excerpt}</div>
              <small>
                Responsible: {item.proposed_responsible_user_id ?? "not detected"} | Due: {item.due_date ?? "not detected"}
              </small>
              {item.ambiguity_reasons?.length ? <small>Reasons: {item.ambiguity_reasons.join(", ")}</small> : null}

              <form onSubmit={(event) => approveCandidate(event, item.id)} style={{ display: "grid", gap: 6, marginTop: 8 }}>
                <input name="title" defaultValue={item.title} placeholder="Title" />
                <input
                  name="responsibleUserId"
                  defaultValue={item.proposed_responsible_user_id ?? ""}
                  placeholder="Responsible user id"
                  required
                />
                <input name="requesterUserId" defaultValue={item.proposed_requester_user_id ?? "demo.requester"} placeholder="Requester user id" required />
                <input name="dueDate" defaultValue={item.due_date ?? ""} type="date" required />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={(event) => {
                      const formEl = event.currentTarget.closest("form");
                      if (!formEl) return;
                      editCandidate(new FormData(formEl), item.id).catch((e) =>
                        setError(e instanceof Error ? e.message : "Edit failed")
                      );
                    }}
                    disabled={pendingId === item.id}
                  >
                    Edit
                  </button>
                  <button type="submit" disabled={pendingId === item.id}>
                    Approve
                  </button>
                  <button type="button" onClick={() => rejectCandidate(item.id)} disabled={pendingId === item.id}>
                    Reject
                  </button>
                </div>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
