import { createPocketBaseClient } from "@/lib/db/pocketbase";
import { sendReminderNotification } from "@/lib/services/notifications";
import { daysUntil, parseReminderOffsets, shouldMarkOverdue, shouldSendDueReminder } from "@/lib/scheduler/rules";

export { daysUntil, parseReminderOffsets, shouldMarkOverdue, shouldSendDueReminder };

export async function runReminderScheduler(actorId: string) {
  const pb = createPocketBaseClient();
  const serviceToken = process.env.POCKETBASE_SERVICE_TOKEN;
  if (serviceToken) pb.authStore.save(serviceToken, null);

  const list = await pb.collection("tasks").getList(1, 200, {
    filter: 'status != "completed"',
    sort: "due_date"
  });

  const offsets = parseReminderOffsets(process.env.REMINDER_DAYS_BEFORE ?? "3,1");
  const today = new Date().toISOString().slice(0, 10);

  let remindersSent = 0;
  let overdueMarked = 0;

  for (const task of list.items as any[]) {
    const days = daysUntil(task.due_date);

    if (shouldMarkOverdue(days, task.status)) {
      await pb.collection("tasks").update(task.id, { status: "overdue" });
      await pb.collection("task_status_history").create({
        task_id: task.id,
        from_status: task.status,
        to_status: "overdue",
        changed_by: actorId,
        changed_at: new Date().toISOString(),
        note: "Marcada automáticamente como vencida"
      });
      overdueMarked += 1;
    }

    if (shouldSendDueReminder(days, offsets)) {
      const key = `${task.id}:due_reminder:${today}`;
      const send = await sendReminderNotification({
        taskId: task.id,
        userId: task.responsible_user_id,
        type: "due_reminder",
        content: `<p>Recordatorio: <b>${task.title}</b> vence el ${task.due_date}</p>`,
        idempotencyKey: key
      });
      if (send.sent) remindersSent += 1;
    }

    if (days < 0) {
      const key = `${task.id}:overdue_reminder:${today}`;
      const send = await sendReminderNotification({
        taskId: task.id,
        userId: task.responsible_user_id,
        type: "overdue_reminder",
        content: `<p>Vencida: <b>${task.title}</b> venció el ${task.due_date}</p>`,
        idempotencyKey: key
      });
      if (send.sent) remindersSent += 1;
    }
  }

  return { remindersSent, overdueMarked, scanned: list.items.length };
}
