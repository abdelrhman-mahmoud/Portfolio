"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
export function Navigation({
  initials,
  name,
  links,
  cv,
  cvLabel,
}: {
  initials: string;
  name: string;
  links: { id: string; label: string }[];
  cv: string;
  cvLabel: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header glass">
      <div className="nav-inner">
        <Link
          href="/"
          aria-label={`${name} — home`}
          className="font-display text-2xl"
        >
          {initials}
          <span className="text-gradient-brand">.</span>
        </Link>
        <nav aria-label="Primary" className="desktop-nav">
          {links.map((link) => (
            <a key={link.id} href={`/#${link.id}`}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {cv && (
            <a
              className="pill small"
              href={cv}
              target="_blank"
              rel="noopener noreferrer"
            >
              {cvLabel}
            </a>
          )}
          <button
            className="mobile-menu"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav aria-label="Mobile" className="mobile-nav">
          {links.map((link) => (
            <a
              key={link.id}
              href={`/#${link.id}`}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
