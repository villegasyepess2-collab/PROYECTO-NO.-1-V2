import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, createPocketBaseClient } from "@/lib/db/pocketbase";
import { isLocalPocAuthBypassEnabled } from "@/lib/auth/session";

function encodeSessionCookie(payload: { token: string; model: { id: string; email: string; role: string } }) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export async function POST(request: Request) {
  if (isLocalPocAuthBypassEnabled()) {
    const response = NextResponse.json({
      user: {
        id: "demo-local-user",
        email: "demo@local.poc",
        role: "admin"
      },
      mode: "poc_local_bypass"
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: encodeSessionCookie({
        token: "demo-local-token",
        model: { id: "demo-local-user", email: "demo@local.poc", role: "admin" }
      }),
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production"
    });

    return response;
  }

  const body = await request.json();
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Correo electrónico y contraseña son obligatorios" }, { status: 400 });
  }

  try {
    const pb = createPocketBaseClient();
    const authData = await pb.collection("users").authWithPassword(email, password);

    const response = NextResponse.json({
      user: {
        id: authData.record.id,
        email: authData.record.email,
        role: authData.record.role ?? "member"
      }
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: encodeSessionCookie({
        token: authData.token,
        model: {
          id: authData.record.id,
          email: authData.record.email,
          role: authData.record.role ?? "member"
        }
      }),
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production"
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }
}
