import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isDemoLocalMode, seedDemoScenario } from "@/lib/demo/local-store";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isDemoLocalMode()) {
    return NextResponse.json(
      { error: "Demo seed is only available in local PoC bypass mode" },
      { status: 400 }
    );
  }

  const result = seedDemoScenario();

  return NextResponse.json({
    message: "Demo scenario loaded",
    actorUserId: session.userId,
    ...result
  });
}
