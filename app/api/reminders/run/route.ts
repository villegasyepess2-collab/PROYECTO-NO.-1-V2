import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ensureDemoScenario, isDemoLocalMode, runDemoReminders } from "@/lib/demo/local-store";
import { runReminderScheduler } from "@/lib/scheduler/reminders";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (isDemoLocalMode()) {
    ensureDemoScenario();
    const result = runDemoReminders();
    return NextResponse.json({ message: "Reminders executed (demo mode)", ...result });
  }

  try {
    const result = await runReminderScheduler(session.userId);
    return NextResponse.json({ message: "Reminders executed", ...result });
  } catch (error) {
    return NextResponse.json(
      { error: "Reminder run failed", detail: error instanceof Error ? error.message : "Unknown error" },
      { status: 502 }
    );
  }
}
