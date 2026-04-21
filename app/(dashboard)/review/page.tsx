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

  const load = async () => {
    const response = await fetch("/api/reviews");
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.detail ?? payload.error ?? "Unable to load queue");
      return;
    }
    setItems(payload.items ?? []);
  };

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Unknown error"));
  }, []);

  const approve = async (event: FormEvent<HTMLFormElement>, candidateId: string) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/reviews/${candidateId}/approve`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        responsibleUserId: form.get("responsibleUserId"),
        requesterUserId: form.get("requesterUserId"),
        dueDate: form.get("dueDate"),
        note: form.get("note")
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.detail ?? payload.error ?? "Approve failed");
      return;
    }

    setMessage(`Task created: ${payload.taskId}`);
    await load();
  };

  const reject = async (candidateId: string) => {
    const response = await fetch(`/api/reviews/${candidateId}/reject`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ note: "Rejected by reviewer" })
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.detail ?? payload.error ?? "Reject failed");
      return;
    }

    setMessage(`Candidate rejected: ${payload.id}`);
    await load();
  };

  return (
    <div className="card">
      <h3>Manual Review Queue</h3>
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
      {message ? <p style={{ color: "#065f46" }}>{message}</p> : null}

      {items.length === 0 ? (
        <p>No candidates waiting for review.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id} style={{ marginBottom: 16 }}>
              <strong>{item.title}</strong> — confidence {item.confidence_score}
              <div>{item.source_excerpt}</div>
              {item.ambiguity_reasons?.length ? <small>Reasons: {item.ambiguity_reasons.join(", ")}</small> : null}

              <form onSubmit={(e) => approve(e, item.id)} style={{ display: "grid", gap: 6, marginTop: 8 }}>
                <input name="responsibleUserId" defaultValue={item.proposed_responsible_user_id ?? ""} placeholder="Responsible user ID" required />
                <input name="requesterUserId" defaultValue={item.proposed_requester_user_id ?? ""} placeholder="Requester user ID" required />
                <input name="dueDate" defaultValue={item.due_date ?? ""} type="date" required />
                <input name="note" placeholder="Review note" />
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit">Approve + Create Task</button>
                  <button type="button" onClick={() => reject(item.id)}>Reject</button>
                </div>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
