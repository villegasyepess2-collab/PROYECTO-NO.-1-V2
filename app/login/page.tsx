"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password")
      })
    });

    if (!res.ok) {
      const payload = await res.json();
      setError(payload.error ?? "Login failed");
      setPending(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <section className="card" style={{ maxWidth: 460, margin: "0 auto" }}>
      <h2>Sign in</h2>
      <p>Authenticate using internal PocketBase credentials.</p>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8 }}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required />
        <button type="submit" disabled={pending}>{pending ? "Signing in..." : "Sign in"}</button>
      </form>
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
    </section>
  );
}
