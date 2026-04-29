import Link from "next/link";
import { requireSession } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <section>
      <div className="card">
        <h2>Bienvenido/a, {session.email}</h2>
        <p>Rol: <span className="code">{session.role}</span></p>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/meetings">Reuniones</Link>
          <Link href="/review">Cola de revisión</Link>
          <Link href="/tasks">Tareas</Link>
        </div>
      </div>
      {children}
    </section>
  );
}
