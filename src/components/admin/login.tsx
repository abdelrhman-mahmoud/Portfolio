"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminApi } from "./api";
export function LoginForm({ configured }: { configured: boolean }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setBusy(true);
    try {
      await adminApi("auth", "POST", {
        email: form.get("email"),
        password: form.get("password"),
      });
      router.replace("/admin");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <main id="main-content" className="admin-login">
      <Link href="/" className="font-display text-3xl text-gradient-brand">
        Portfolio Studio.
      </Link>
      <h1>Welcome back.</h1>
      <p className="muted">Sign in to manage your portfolio.</p>
      {!configured ? (
        <div className="setup-notice">
          <h2>Initial setup required</h2>
          <p>
            Configure MongoDB and an authentication secret, then run the seed
            and first-admin commands from SETUP.md.
          </p>
          <code>
            npm run seed
            <br />
            npm run admin:create
          </code>
          <p>This dashboard has no default password or public registration.</p>
        </div>
      ) : (
        <form onSubmit={submit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            maxLength={256}
            required
          />
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} className="pill primary">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      )}
      <Link href="/">Return to portfolio</Link>
    </main>
  );
}
