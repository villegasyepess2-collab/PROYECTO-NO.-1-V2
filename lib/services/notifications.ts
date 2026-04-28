import { createPocketBaseClient } from "@/lib/db/pocketbase";
import { isDemoLocalMode, recordDemoNotificationAttempt } from "@/lib/demo/local-store";
import { sendTeamsChatMessage } from "@/lib/teams/chat-message";

async function resolveUserForNotification(pb: ReturnType<typeof createPocketBaseClient>, userId: string) {
  return pb.collection("users").getOne(userId);
}

async function withRetry<T>(fn: () => Promise<T>, attempts: number): Promise<{ result?: T; error?: Error; tries: number }> {
  let lastError: Error | undefined;

  for (let i = 1; i <= attempts; i += 1) {
    try {
      const result = await fn();
      return { result, tries: i };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown send error");
    }
  }

  return { error: lastError, tries: attempts };
}

export async function createAndSendTaskCreatedNotifications(params: {
  taskId: string;
  responsibleUserId: string;
  requesterUserId: string;
  taskTitle: string;
  dueDate: string;
}) {
  if (isDemoLocalMode()) {
    return createAndSendTaskCreatedNotificationsDemo(params);
  }

  const pb = createPocketBaseClient();
  const serviceToken = process.env.POCKETBASE_SERVICE_TOKEN;
  if (serviceToken) pb.authStore.save(serviceToken, null);

  const recipients = [params.responsibleUserId, params.requesterUserId];
  const sent: string[] = [];

  for (const userId of recipients) {
    const idempotencyKey = `${params.taskId}:task_created:${userId}`;

    let existing = null;
    try {
      existing = await pb.collection("notifications").getFirstListItem(`idempotency_key = "${idempotencyKey}"`);
    } catch {
      existing = null;
    }

    if (existing) continue;

    const user = await resolveUserForNotification(pb, userId);

    const notification = await pb.collection("notifications").create({
      task_id: params.taskId,
      user_id: userId,
      type: "task_created",
      status: "pending",
      idempotency_key: idempotencyKey
    });

    const htmlBody = `<p>Task assigned: <b>${params.taskTitle}</b></p><p>Due date: ${params.dueDate}</p>`;

    const retry = await withRetry(() => sendTeamsChatMessage({ chatId: user.teams_chat_id, htmlBody }), 3);

    for (let attempt = 1; attempt <= retry.tries; attempt += 1) {
      await pb.collection("notification_attempts").create({
        notification_id: notification.id,
        attempt_no: attempt,
        provider: "graph_chatmessage",
        success: attempt === retry.tries && !retry.error,
        error_code: attempt === retry.tries ? retry.error?.message : "retry",
        raw_response: attempt === retry.tries ? JSON.stringify(retry.result ?? {}) : "{}"
      });
    }

    if (retry.error) {
      await pb.collection("notifications").update(notification.id, { status: "failed" });
    } else {
      await pb.collection("notifications").update(notification.id, { status: "delivered" });
      sent.push(notification.id);
    }
  }

  return { sentCount: sent.length };
}

function buildTaskCreatedNotificationContent(params: {
  taskId: string;
  taskTitle: string;
  dueDate: string;
  responsibleUserId: string;
  requesterUserId: string;
  sourceExcerpt?: string;
}) {
  const preview = `Task "${params.taskTitle}" assigned to ${params.responsibleUserId} (due ${params.dueDate})`;
  const htmlBody = [
    `<p><b>Task assigned</b></p>`,
    `<p>Task: <b>${params.taskTitle}</b></p>`,
    `<p>Responsible: ${params.responsibleUserId}</p>`,
    `<p>Requester: ${params.requesterUserId}</p>`,
    `<p>Due date: ${params.dueDate}</p>`,
    `<p>Task ID: ${params.taskId}</p>`,
    `<p>Evidence: ${params.sourceExcerpt ?? "N/A"}</p>`
  ].join("");

  return { preview, htmlBody };
}

async function createAndSendTaskCreatedNotificationsDemo(params: {
  taskId: string;
  responsibleUserId: string;
  requesterUserId: string;
  taskTitle: string;
  dueDate: string;
  sourceExcerpt?: string;
}) {
  const recipients = [params.responsibleUserId, params.requesterUserId];
  const content = buildTaskCreatedNotificationContent(params);

  for (const recipient of recipients) {
    recordDemoNotificationAttempt({
      taskId: params.taskId,
      recipientUserId: recipient,
      messagePreview: content.preview,
      messagePayload: content.htmlBody,
      status: "mock_sent",
      idempotencyKey: `${params.taskId}:task_created:${recipient}`
    });
  }

  return { sentCount: recipients.length, mode: "mock_sent" as const, preview: content.preview };
}

export async function sendReminderNotification(params: {
  taskId: string;
  userId: string;
  type: "due_reminder" | "overdue_reminder";
  content: string;
  idempotencyKey: string;
}) {
  const pb = createPocketBaseClient();
  const serviceToken = process.env.POCKETBASE_SERVICE_TOKEN;
  if (serviceToken) pb.authStore.save(serviceToken, null);

  try {
    await pb.collection("notifications").getFirstListItem(`idempotency_key = "${params.idempotencyKey}"`);
    return { skipped: true };
  } catch {
    // proceed
  }

  const user = await pb.collection("users").getOne(params.userId);
  const notification = await pb.collection("notifications").create({
    task_id: params.taskId,
    user_id: params.userId,
    type: params.type,
    status: "pending",
    idempotency_key: params.idempotencyKey
  });

  const retry = await withRetry(() => sendTeamsChatMessage({ chatId: user.teams_chat_id, htmlBody: params.content }), 3);

  for (let attempt = 1; attempt <= retry.tries; attempt += 1) {
    await pb.collection("notification_attempts").create({
      notification_id: notification.id,
      attempt_no: attempt,
      provider: "graph_chatmessage",
      success: attempt === retry.tries && !retry.error,
      error_code: attempt === retry.tries ? retry.error?.message : "retry",
      raw_response: attempt === retry.tries ? JSON.stringify(retry.result ?? {}) : "{}"
    });
  }

  if (retry.error) {
    await pb.collection("notifications").update(notification.id, { status: "failed" });
    return { skipped: false, sent: false };
  }

  await pb.collection("notifications").update(notification.id, { status: "delivered" });
  return { skipped: false, sent: true };
}
