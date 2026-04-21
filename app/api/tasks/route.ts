import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createPocketBaseClient } from "@/lib/db/pocketbase";
import { ensureDemoScenario, getDemoTasks, isDemoLocalMode } from "@/lib/demo/local-store";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (isDemoLocalMode()) {
    ensureDemoScenario();
    return NextResponse.json({ items: getDemoTasks() });
  }

  try {
    const pb = createPocketBaseClient();
    const serviceToken = process.env.POCKETBASE_SERVICE_TOKEN;
    if (serviceToken) pb.authStore.save(serviceToken, null);

    const list = await pb.collection("tasks").getList(1, 100, { sort: "due_date" });
    return NextResponse.json({ items: list.items });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to load tasks", detail: error instanceof Error ? error.message : "Unknown error" },
      { status: 502 }
    );
  }
}
