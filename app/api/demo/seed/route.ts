import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isDemoLocalMode, seedDemoScenario } from "@/lib/demo/local-store";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!isDemoLocalMode()) {
    return NextResponse.json(
      { error: "La carga demo solo está disponible en modo PoC local con bypass" },
      { status: 400 }
    );
  }

  const result = seedDemoScenario();

  return NextResponse.json({
    message: "Escenario demo cargado",
    actorUserId: session.userId,
    ...result
  });
}
