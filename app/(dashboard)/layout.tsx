import Link from "next/link";
import { requireSession } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <section>
      <div className="card">
        <h2>Welcome, {session.email}</h2>
        <p>Role: <span className="code">{session.role}</span></p>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/meetings">Meetings</Link>
          <Link href="/review">Review Queue</Link>
          <Link href="/tasks">Tasks</Link>
        </div>
      </div>
      {children}
    </section>
  );
}
