"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi } from "./api";
type Overview = {
  totals: Record<string, number>;
  recent: { action: string; collection: string; createdAt: string }[];
};
export function Dashboard() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    adminApi("overview")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <>
      <div className="admin-heading">
        <div>
          <span className="eyebrow">YOUR WORK, YOUR STORY</span>
          <h1>Portfolio overview</h1>
          <p className="muted">
            Keep your work and the story behind it up to date.
          </p>
        </div>
        <Link className="pill" href="/admin/preview" target="_blank">
          Preview portfolio
        </Link>
      </div>
      {error && (
        <p className="toast error" role="alert">
          {error}
        </p>
      )}
      <div className="dashboard-stats">
        {[
          ["projects", "Projects"],
          ["featured", "Featured projects"],
          ["publications", "Publications"],
          ["certifications", "Courses & certifications"],
          ["experiences", "Experience entries"],
        ].map(([key, label]) => (
          <Link
            className="content-card"
            key={key}
            href={`/admin/${key === "featured" ? "projects" : key}`}
          >
            <span className="stat-value font-display">
              {data?.totals[key] ?? "—"}
            </span>
            <span>{label}</span>
          </Link>
        ))}
      </div>
      <section className="admin-block">
        <h2>Quick edits</h2>
        <div className="quick-edits">
          {[
            ["profile", "Update profile & hero"],
            ["projects", "Manage projects"],
            ["media", "Upload media"],
            ["contact", "Update CV & social links"],
            ["sectionSettings", "Arrange sections"],
          ].map(([key, label]) => (
            <Link className="pill" href={`/admin/${key}`} key={key}>
              {label}
            </Link>
          ))}
        </div>
      </section>
      <section className="admin-block">
        <h2>Recent edits</h2>
        {!data ? (
          <p>Loading activity…</p>
        ) : !data.recent.length ? (
          <p className="muted">Your edits will appear here.</p>
        ) : (
          <ul className="activity-list">
            {data.recent.map((entry, i) => (
              <li key={i}>
                <span>
                  {entry.action} · {entry.collection}
                </span>
                <time dateTime={entry.createdAt}>
                  {new Date(entry.createdAt).toLocaleString()}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
