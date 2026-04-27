import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createPocketBaseClient } from "@/lib/db/pocketbase";
import { getDemoReviewItems, isDemoLocalMode } from "@/lib/demo/local-store";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (isDemoLocalMode()) {
    const items = getDemoReviewItems().sort((a, b) => b.created.localeCompare(a.created));
    return NextResponse.json({ items });
  }

  try {
    const pb = createPocketBaseClient();
    const serviceToken = process.env.POCKETBASE_SERVICE_TOKEN;
    if (serviceToken) pb.authStore.save(serviceToken, null);

    const list = await pb.collection("task_candidates").getList(1, 50, {
      filter: 'status = "requires_review"',
      sort: "-created"
    });

    return NextResponse.json({ items: list.items });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to load review queue", detail: error instanceof Error ? error.message : "Unknown error" },
      { status: 502 }
    );
  }
}
