import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME } from "@/lib/db/pocketbase";
import type { AppSession } from "@/lib/types/pocketbase";

const DEMO_SESSION: AppSession = {
  userId: "demo-local-user",
  email: "demo@local.poc",
  role: "admin",
  token: "demo-local-token"
};

export function isLocalPocAuthBypassEnabled(): boolean {
  const explicit = process.env.POC_DEMO_AUTH_BYPASS;
  if (explicit === "true") return true;
  if (explicit === "false") return false;
  return process.env.NODE_ENV !== "production";
}

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
  // PoC-only local bypass to unblock demo without real PocketBase credentials.
  if (isLocalPocAuthBypassEnabled()) return DEMO_SESSION;

  const store = await cookies();
  const encoded = store.get(AUTH_COOKIE_NAME)?.value;
  return parseSessionCookie(encoded);
}

export async function requireSession(): Promise<AppSession> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
