import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plataforma de Tareas de Reunión",
  description: "Base interna V1 para extracción de tareas en reuniones"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="header">
          <h1>Plataforma de Tareas de Reunión</h1>
          <nav>
            <Link className="nav-link" href="/meetings">Reuniones</Link>
            <Link className="nav-link" href="/review">Revisión</Link>
            <Link className="nav-link" href="/tasks">Tareas</Link>
            <Link className="nav-link" href="/login">Iniciar sesión</Link>
          </nav>
        </header>
        <main className="main">{children}</main>
      </body>
    </html>
  );
}
