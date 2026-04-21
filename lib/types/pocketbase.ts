export interface AuthCookiePayload {
  token: string;
  model: { id: string; email?: string; role?: string } | null;
}

export interface AppSession {
  userId: string;
  email: string;
  role: "member" | "reviewer" | "admin";
  token: string;
}
