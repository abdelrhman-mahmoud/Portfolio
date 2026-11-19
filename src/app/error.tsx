"use client";
import Link from "next/link";
export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <main id="main-content" className="digital-card">
      <h1>Temporarily unavailable</h1>
      <p>The page could not load. Please try again shortly.</p>
      <button className="pill primary" onClick={retry}>
        Try again
      </button>
      <a href="mailto:abdo.elsaadny74@gmail.com">Email Abdelrhman</a>
      <Link href="/admin/login">Admin sign in</Link>
    </main>
  );
}
