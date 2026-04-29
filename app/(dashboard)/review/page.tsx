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
      setError(payload.detail ?? payload.error ?? "No se pudo cargar la cola de revisión");
      setLoading(false);
      return;
    }

    setItems(payload.items ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Error desconocido"));
  }, []);

  const seedTeamsAndLoad = async () => {
    setError(null);
    const response = await fetch("/api/demo/seed-teams", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        meetingTitle: "Demo de Teams para cola de revisión",
        transcriptText:
          "Solicito que Carla prepare el resumen de la liberación para el viernes y lo comparta con soporte."
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.detail ?? payload.error ?? "No se pudo cargar la demo de Teams");
      return;
    }

    setMessage(`Demo de Teams cargada: ${payload.meetingId}`);
    await load();
  };

  const seedInPersonAndLoad = async () => {
    setError(null);
    const response = await fetch("/api/demo/seed-inperson", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        meetingTitle: "Demo presencial para cola de revisión",
        transcriptText:
          "En este seguimiento presencial, María pidió a Diego entregar la lista del piloto para el próximo jueves."
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.detail ?? payload.error ?? "No se pudo cargar la demo presencial");
      return;
    }

    setMessage(`Demo presencial cargada: ${payload.meetingId}`);
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
        note: "Editado en revisión PoC"
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.detail ?? payload.error ?? "Error al editar");
      setPendingId(null);
      return;
    }

    setMessage(`Candidato actualizado: ${payload.id}`);
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
        note: "Aprobado en revisión PoC"
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.detail ?? payload.error ?? "Error al aprobar");
      setPendingId(null);
      return;
    }

    setMessage(`Tarea creada: ${payload.taskId}`);
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
      body: JSON.stringify({ note: "Rechazado en revisión PoC" })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.detail ?? payload.error ?? "Error al rechazar");
      setPendingId(null);
      return;
    }

    setMessage(`Candidato rechazado: ${payload.id}`);
    await load();
    setPendingId(null);
  };

  return (
    <div className="card">
      <h3>Cola de revisión manual</h3>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button onClick={seedTeamsAndLoad}>Cargar candidatos demo de Teams</button>
        <button onClick={seedInPersonAndLoad}>Cargar candidatos demo presenciales</button>
        <button onClick={load} disabled={loading}>{loading ? "Actualizando..." : "Actualizar cola"}</button>
      </div>
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
      {message ? <p style={{ color: "#065f46" }}>{message}</p> : null}

      {items.length === 0 ? (
        <p>No hay candidatos pendientes de revisión.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id} style={{ marginBottom: 20 }}>
              <strong>{item.title}</strong> — confianza {item.confidence_score}
              <div>{item.source_excerpt}</div>
              <small>
                Responsable: {item.proposed_responsible_user_id ?? "no detectado"} | Fecha límite: {item.due_date ?? "no detectada"}
              </small>
              {item.ambiguity_reasons?.length ? <small>Motivos: {item.ambiguity_reasons.join(", ")}</small> : null}

              <form onSubmit={(event) => approveCandidate(event, item.id)} style={{ display: "grid", gap: 6, marginTop: 8 }}>
                <input name="title" defaultValue={item.title} placeholder="Título" />
                <input
                  name="responsibleUserId"
                  defaultValue={item.proposed_responsible_user_id ?? ""}
                  placeholder="ID de usuario responsable"
                  required
                />
                <input
                  name="requesterUserId"
                  defaultValue={item.proposed_requester_user_id ?? "demo.requester"}
                  placeholder="ID de usuario solicitante"
                  required
                />
                <input name="dueDate" defaultValue={item.due_date ?? ""} type="date" required />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={(event) => {
                      const formEl = event.currentTarget.closest("form");
                      if (!formEl) return;
                      editCandidate(new FormData(formEl), item.id).catch((e) =>
                        setError(e instanceof Error ? e.message : "Error al editar")
                      );
                    }}
                    disabled={pendingId === item.id}
                  >
                    Editar
                  </button>
                  <button type="submit" disabled={pendingId === item.id}>
                    Aprobar
                  </button>
                  <button type="button" onClick={() => rejectCandidate(item.id)} disabled={pendingId === item.id}>
                    Rechazar
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
