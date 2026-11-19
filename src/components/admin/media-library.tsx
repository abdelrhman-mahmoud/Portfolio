"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { adminApi } from "./api";
import { MediaPicker, type Asset } from "./media-picker";
export function MediaLibrary() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [active, setActive] = useState<Asset | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [upload, setUpload] = useState(false);
  const [loading, setLoading] = useState(true);
  async function load() {
    setAssets(await adminApi("media"));
  }
  useEffect(() => {
    adminApi("media")
      .then(setAssets)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  async function save() {
    if (!active) return;
    setBusy(true);
    try {
      await adminApi(`media/${active._id}`, "PATCH", {
        alt: active.alt,
        caption: active.caption,
      });
      await load();
      setNotice(
        "Media metadata saved. New gallery selections use this text; existing gallery captions remain independently editable.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(asset: Asset) {
    if (
      !window.confirm(
        "Permanently delete this media file? Files used by content cannot be deleted.",
      )
    )
      return;
    setBusy(true);
    try {
      await adminApi(`media/${asset._id}`, "DELETE");
      setActive(null);
      await load();
      setNotice("Media deleted.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">YOUR ASSETS</p>
          <h1>Media Library</h1>
          <p className="muted">
            Upload images and PDFs directly from your device.
          </p>
        </div>
        <button className="pill primary" onClick={() => setUpload(!upload)}>
          {upload ? "Close uploader" : "Upload media"}
        </button>
      </div>
      {notice && (
        <p role="status" className="toast success">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="toast error">
          {error}
        </p>
      )}
      {upload && (
        <MediaPicker
          select={async (asset) => {
            setActive(asset);
            setUpload(false);
            await load();
          }}
        />
      )}
      <input
        aria-label="Search media"
        placeholder="Search by alt text or filename…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {active && (
        <section className="admin-block">
          <h2>Edit media</h2>
          <label htmlFor="media-alt">Alt text</label>
          <input
            id="media-alt"
            value={active.alt}
            onChange={(e) => setActive({ ...active, alt: e.target.value })}
          />
          <label htmlFor="media-caption">Caption</label>
          <input
            id="media-caption"
            value={active.caption}
            onChange={(e) => setActive({ ...active, caption: e.target.value })}
          />
          <div className="row-actions">
            <button className="pill primary" disabled={busy} onClick={save}>
              Save metadata
            </button>
            <a href={active.url} target="_blank" rel="noopener noreferrer">
              Open original
            </a>
            <button
              disabled={busy}
              className="danger-button"
              onClick={() => remove(active)}
            >
              Delete file
            </button>
            <button onClick={() => setActive(null)}>Close</button>
          </div>
        </section>
      )}
      <div className="library-grid">
        {assets
          .filter((asset) =>
            `${asset.alt} ${asset.url}`
              .toLowerCase()
              .includes(query.toLowerCase()),
          )
          .map((asset) => (
            <button
              className="content-card"
              key={asset._id}
              onClick={() => setActive(asset)}
            >
              {asset.mimeType.startsWith("image/") ? (
                <Image
                  src={asset.url}
                  alt={asset.alt || "Uploaded image"}
                  width={300}
                  height={200}
                  className="object-contain"
                />
              ) : (
                <div className="pdf-preview">PDF</div>
              )}
              <strong>{asset.alt || asset.url.split("/").pop()}</strong>
              <span>
                {(asset.size / 1024).toFixed(0)} KB{" "}
                {asset.width && `· ${asset.width} × ${asset.height}`}
              </span>
            </button>
          ))}
      </div>
      {loading ? (
        <p className="empty-state">Loading media…</p>
      ) : (
        !assets.length && (
          <p className="empty-state">
            Add a portrait, project screenshots, or certificate files to get
            started.
          </p>
        )
      )}
    </>
  );
}
