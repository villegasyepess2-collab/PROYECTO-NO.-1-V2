import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meeting Task Platform",
  description: "Internal V1 foundation for meeting task extraction"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <h1>Meeting Task Platform</h1>
          <nav>
            <Link className="nav-link" href="/meetings">Meetings</Link>
            <Link className="nav-link" href="/review">Review</Link>
            <Link className="nav-link" href="/tasks">Tasks</Link>
            <Link className="nav-link" href="/login">Login</Link>
          </nav>
        </header>
        <main className="main">{children}</main>
      </body>
    </html>
  );
}
