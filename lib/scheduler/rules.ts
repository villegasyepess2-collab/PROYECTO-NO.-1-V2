export function parseReminderOffsets(raw: string): number[] {
  return raw
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((v) => Number.isFinite(v) && v >= 0);
}

export function daysUntil(dateIso: string): number {
  const now = new Date();
  const due = new Date(dateIso);
  return Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function shouldSendDueReminder(daysToDue: number, offsets: number[]): boolean {
  return daysToDue >= 0 && offsets.includes(daysToDue);
}

export function shouldMarkOverdue(daysToDue: number, status: string): boolean {
  return daysToDue < 0 && status !== "overdue" && status !== "completed";
}
