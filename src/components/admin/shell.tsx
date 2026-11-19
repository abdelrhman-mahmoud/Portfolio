"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { definitions } from "@/lib/cms/model";
import { adminApi } from "./api";
export function AdminShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const links = [
    { href: "/admin", label: "Dashboard" },
    ...Object.entries(definitions).map(([key, def]) => ({
      href: `/admin/${key}`,
      label: def.label,
    })),
    { href: "/admin/media", label: "Media Library" },
  ];
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand">
          Studio<span className="text-gradient-brand">.</span>
        </Link>
        <p className="sidebar-caption">PORTFOLIO ADMIN</p>
        <nav aria-label="Admin">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={path === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <Link href="/" target="_blank">
            View website
          </Link>
          <Link href="/admin/preview" target="_blank">
            Preview all content
          </Link>
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await adminApi("auth", "DELETE");
                router.replace("/admin/login");
                router.refresh();
              } catch (e) {
                setError((e as Error).message);
                setBusy(false);
              }
            }}
          >
            {busy ? "Signing out…" : "Sign out"}
          </button>
          {error && <p role="alert">{error}</p>}
        </div>
      </aside>
      <main className="admin-main" id="main-content">
        {children}
      </main>
    </div>
  );
}
