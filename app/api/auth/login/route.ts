import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, createPocketBaseClient } from "@/lib/db/pocketbase";

export async function POST(request: Request) {
  const body = await request.json();
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  try {
    const pb = createPocketBaseClient();
    const authData = await pb.collection("users").authWithPassword(email, password);
    const encodedCookie = Buffer.from(
      JSON.stringify({ token: authData.token, model: { id: authData.record.id, email: authData.record.email, role: authData.record.role ?? "member" } })
    ).toString("base64url");

    const response = NextResponse.json({
      user: {
        id: authData.record.id,
        email: authData.record.email,
        role: authData.record.role ?? "member"
      }
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: encodedCookie,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production"
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
}
