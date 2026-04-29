"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const startDemo = async () => {
    setPending(true);
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });

    if (!res.ok) {
      const payload = await res.json();
      setError(payload.error ?? "Error al iniciar demo");
      setPending(false);
      return;
    }

    router.push("/meetings");
    router.refresh();
  };

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
      setError(payload.error ?? "Error al iniciar sesión");
      setPending(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <section className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
      <h2>Iniciar sesión</h2>
      <p>
        <strong>Modo PoC local:</strong> usa <em>Iniciar demostración local</em> para omitir credenciales reales de
        PocketBase. Es temporal y solo para validación local.
      </p>

      <button onClick={startDemo} disabled={pending} style={{ marginBottom: 12 }}>
        {pending ? "Iniciando demo..." : "Iniciar demostración local"}
      </button>

      <details>
        <summary>Usar credenciales reales (ruta MVP)</summary>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, marginTop: 8 }}>
          <label htmlFor="email">Correo electrónico</label>
          <input id="email" name="email" type="email" />
          <label htmlFor="password">Contraseña</label>
          <input id="password" name="password" type="password" />
          <button type="submit" disabled={pending}>{pending ? "Iniciando sesión..." : "Iniciar sesión"}</button>
        </form>
      </details>

      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
    </section>
  );
}
