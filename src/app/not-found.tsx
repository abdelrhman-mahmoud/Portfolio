import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main-content" className="digital-card">
      <h1 className="font-display">Page not found.</h1>
      <p>This page may have moved or is no longer published.</p>
      <Link className="pill primary" href="/">
        Return to portfolio
      </Link>
    </main>
  );
}
