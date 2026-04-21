import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME } from "@/lib/db/pocketbase";
import type { AppSession } from "@/lib/types/pocketbase";

function parseSessionCookie(rawCookie: string | undefined): AppSession | null {
  if (!rawCookie) return null;

  try {
    const payload = JSON.parse(Buffer.from(rawCookie, "base64url").toString("utf-8"));
    if (!payload?.token || !payload?.model?.id) return null;

    return {
      userId: payload.model.id,
      email: payload.model.email ?? "unknown@local",
      role: payload.model.role ?? "member",
      token: payload.token
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AppSession | null> {
  const store = await cookies();
  const encoded = store.get(AUTH_COOKIE_NAME)?.value;
  return parseSessionCookie(encoded);
}

export async function requireSession(): Promise<AppSession> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
