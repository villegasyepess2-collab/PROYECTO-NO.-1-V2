"use client";

import { FormEvent, useEffect, useState } from "react";

interface TaskItem {
  id: string;
  title: string;
  status: string;
  due_date: string;
  responsible_user_id: string;
  requester_user_id?: string;
  source_excerpt?: string;
  notification_status?: "not_triggered" | "mock_sent" | "sent" | "failed";
  notification_attempt_count?: number;
  notification_preview?: string | null;
  reminder_status?: "not_triggered" | "mock_sent" | "sent" | "failed";
  reminder_attempt_count?: number;
  reminder_last_run_at?: string | null;
}

const statusLabel: Record<string, string> = {
  pending: "pendiente",
  in_progress: "en progreso",
  blocked: "bloqueada",
  overdue: "vencida",
  completed: "completada"
};

const deliveryStatusLabel: Record<string, string> = {
  not_triggered: "no ejecutado",
  mock_sent: "simulado_enviado",
  sent: "enviado",
  failed: "fallido"
};

export default function TasksPage() {
  const [items, setItems] = useState<TaskItem[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = async () => {
    const response = await fetch("/api/tasks");
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.detail ?? payload.error ?? "No se pudieron cargar las tareas");
      return;
    }

    const nextItems = payload.items ?? [];
    setItems(nextItems);
    if (nextItems.length > 0) setSelectedTaskId(nextItems[0].id);
  };

  useEffect(() => {
    loadTasks().catch((e) => setError(e instanceof Error ? e.message : "Error desconocido"));
  }, []);

  const updateStatus = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const form = new FormData(event.currentTarget);
    const taskId = selectedTaskId || String(form.get("taskId"));

    const response = await fetch(`/api/tasks/${taskId}/status`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        status: form.get("status"),
        note: form.get("note")
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.detail ?? payload.error ?? "Error al actualizar el estado");
      return;
    }

    setMessage(`Tarea ${payload.id} actualizada a ${statusLabel[payload.status] ?? payload.status}`);
    await loadTasks();
  };

  const runReminders = async () => {
    setMessage(null);
    setError(null);

    const response = await fetch("/api/reminders/run", { method: "POST" });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.detail ?? payload.error ?? "Error al ejecutar recordatorios");
      return;
    }

    setMessage(`Recordatorios enviados: ${payload.remindersSent}, tareas vencidas marcadas: ${payload.overdueMarked}`);
    await loadTasks();
  };

  return (
    <section className="card">
      <h3>Tareas creadas desde revisión</h3>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button onClick={loadTasks}>Recargar tareas</button>
        <button onClick={runReminders}>Ejecutar recordatorios</button>
      </div>

      {items.length > 0 ? (
        <ul>
          {items.map((task) => (
            <li key={task.id}>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="radio"
                  name="selectedTask"
                  value={task.id}
                  checked={selectedTaskId === task.id}
                  onChange={() => setSelectedTaskId(task.id)}
                />
                <span>
                  <strong>{task.title}</strong> ({statusLabel[task.status] ?? task.status}) · fecha límite {task.due_date} · responsable{" "}
                  {task.responsible_user_id}
                  {task.requester_user_id ? ` · solicitante ${task.requester_user_id}` : ""}
                </span>
              </label>
              {task.source_excerpt ? <div><small>Evidencia: {task.source_excerpt}</small></div> : null}
              <div>
                <small>
                  Estado de notificación: {deliveryStatusLabel[task.notification_status ?? "not_triggered"]} · intentos:{" "}
                  {task.notification_attempt_count ?? 0}
                </small>
              </div>
              {task.notification_preview ? <div><small>Vista previa del mensaje: {task.notification_preview}</small></div> : null}
              <div>
                <small>
                  Estado de recordatorio: {deliveryStatusLabel[task.reminder_status ?? "not_triggered"]} · intentos:{" "}
                  {task.reminder_attempt_count ?? 0}
                </small>
              </div>
              {task.reminder_last_run_at ? <div><small>Último recordatorio: {task.reminder_last_run_at}</small></div> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p>No hay tareas disponibles. Carga el escenario demo desde Reuniones o Revisión.</p>
      )}

      <form onSubmit={updateStatus} style={{ display: "grid", gap: 8, marginBottom: 12 }}>
        <input
          name="taskId"
          value={selectedTaskId}
          onChange={(event) => setSelectedTaskId(event.target.value)}
          placeholder="ID de tarea"
          required
        />
        <select name="status" defaultValue="in_progress">
          <option value="pending">pendiente</option>
          <option value="in_progress">en progreso</option>
          <option value="blocked">bloqueada</option>
          <option value="overdue">vencida</option>
          <option value="completed">completada</option>
        </select>
        <input name="note" placeholder="Nota del cambio" />
        <button type="submit">Actualizar estado</button>
      </form>

      {message ? <p style={{ color: "#065f46" }}>{message}</p> : null}
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
    </section>
  );
}
