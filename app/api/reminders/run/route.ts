import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isDemoLocalMode, runDemoReminders } from "@/lib/demo/local-store";
import { runReminderScheduler } from "@/lib/scheduler/reminders";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (isDemoLocalMode()) {
    const result = runDemoReminders();
    return NextResponse.json({ message: "Recordatorios ejecutados (modo demo)", ...result });
  }

  try {
    const result = await runReminderScheduler(session.userId);
    return NextResponse.json({ message: "Recordatorios ejecutados", ...result });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al ejecutar recordatorios", detail: error instanceof Error ? error.message : "Error desconocido" },
      { status: 502 }
    );
  }
}
