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

export default function TasksPage() {
  const [items, setItems] = useState<TaskItem[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = async () => {
    const response = await fetch("/api/tasks");
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.detail ?? payload.error ?? "Unable to load tasks");
      return;
    }

    const nextItems = payload.items ?? [];
    setItems(nextItems);
    if (nextItems.length > 0) setSelectedTaskId(nextItems[0].id);
  };

  useEffect(() => {
    loadTasks().catch((e) => setError(e instanceof Error ? e.message : "Unknown error"));
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
      setError(payload.detail ?? payload.error ?? "Status update failed");
      return;
    }

    setMessage(`Task ${payload.id} updated to ${payload.status}`);
    await loadTasks();
  };

  const runReminders = async () => {
    setMessage(null);
    setError(null);

    const response = await fetch("/api/reminders/run", { method: "POST" });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.detail ?? payload.error ?? "Reminder run failed");
      return;
    }

    setMessage(`Reminders sent: ${payload.remindersSent}, overdue marked: ${payload.overdueMarked}`);
    await loadTasks();
  };

  return (
    <section className="card">
      <h3>Tasks created from review</h3>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button onClick={loadTasks}>Reload tasks</button>
        <button onClick={runReminders}>Run reminders</button>
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
                  <strong>{task.title}</strong> ({task.status}) · due {task.due_date} · owner {task.responsible_user_id}
                  {task.requester_user_id ? ` · requester ${task.requester_user_id}` : ""}
                </span>
              </label>
              {task.source_excerpt ? <div><small>Evidence: {task.source_excerpt}</small></div> : null}
              <div>
                <small>
                  Notification: {task.notification_status ?? "not_triggered"} · attempts: {task.notification_attempt_count ?? 0}
                </small>
              </div>
              {task.notification_preview ? <div><small>Message: {task.notification_preview}</small></div> : null}
              <div>
                <small>
                  Reminder: {task.reminder_status ?? "not_triggered"} · attempts: {task.reminder_attempt_count ?? 0}
                </small>
              </div>
              {task.reminder_last_run_at ? <div><small>Last reminder: {task.reminder_last_run_at}</small></div> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p>No tasks available. Load the demo scenario from Meetings or Review.</p>
      )}

      <form onSubmit={updateStatus} style={{ display: "grid", gap: 8, marginBottom: 12 }}>
        <input
          name="taskId"
          value={selectedTaskId}
          onChange={(event) => setSelectedTaskId(event.target.value)}
          placeholder="Task ID"
          required
        />
        <select name="status" defaultValue="in_progress">
          <option value="pending">pending</option>
          <option value="in_progress">in_progress</option>
          <option value="blocked">blocked</option>
          <option value="overdue">overdue</option>
          <option value="completed">completed</option>
        </select>
        <input name="note" placeholder="Change note" />
        <button type="submit">Update status</button>
      </form>

      {message ? <p style={{ color: "#065f46" }}>{message}</p> : null}
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
    </section>
  );
}
