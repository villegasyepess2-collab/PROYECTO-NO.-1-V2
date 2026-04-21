"use client";

import { FormEvent, useState } from "react";

export default function TasksPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const form = new FormData(event.currentTarget);
    const taskId = String(form.get("taskId"));

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
  };

  return (
    <section className="card">
      <h3>Task Lifecycle + Reminders</h3>

      <form onSubmit={updateStatus} style={{ display: "grid", gap: 8, marginBottom: 12 }}>
        <input name="taskId" placeholder="Task ID" required />
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

      <button onClick={runReminders}>Run reminder scheduler</button>

      {message ? <p style={{ color: "#065f46" }}>{message}</p> : null}
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
    </section>
  );
}
