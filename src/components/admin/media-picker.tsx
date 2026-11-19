"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { adminApi } from "./api";
export type Asset = {
  _id: string;
  url: string;
  alt: string;
  caption: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
};
export function MediaPicker({
  select,
  selectMany,
  imagesOnly = false,
}: {
  select: (asset: Asset) => void;
  selectMany?: (assets: Asset[]) => void;
  imagesOnly?: boolean;
}) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  useEffect(() => {
    adminApi("media")
      .then(setAssets)
      .catch((e) => setError(e.message));
  }, []);
  async function upload(files: File[]) {
    if (!files.length) return;
    if (files.some((file) => file.size > 4 * 1024 * 1024)) {
      setError("Maximum file size is 4 MB.");
      return;
    }
    setBusy(true);
    setError("");
    const uploaded: Asset[] = [];
    try {
      for (const [index, file] of files.entries()) {
        setProgress(`Uploading ${index + 1} of ${files.length}…`);
        uploaded.push(await adminApi("media", "POST", file, true));
      }
      if (selectMany) selectMany(uploaded);
      else select(uploaded[0]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAssets((current) => [...uploaded, ...current]);
      setBusy(false);
      setProgress("");
    }
  }
  return (
    <div className="media-picker">
      <label className="upload-zone">
        {busy
          ? progress || "Uploading…"
          : imagesOnly
            ? "Upload image from your device (up to 4 MB)"
            : "Upload image or PDF from your device (up to 4 MB)"}
        <input
          disabled={busy}
          type="file"
          multiple={!!selectMany}
          accept={
            imagesOnly
              ? "image/jpeg,image/png,image/webp"
              : "image/jpeg,image/png,image/webp,application/pdf"
          }
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            e.target.value = "";
            void upload(files);
          }}
        />
      </label>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <div className="media-options">
        {assets
          .filter((a) => !imagesOnly || a.mimeType.startsWith("image/"))
          .map((asset) => (
            <button type="button" key={asset._id} onClick={() => select(asset)}>
              {asset.mimeType.startsWith("image/") ? (
                <Image
                  src={asset.url}
                  alt={asset.alt || "Select uploaded image"}
                  width={160}
                  height={100}
                  className="object-contain"
                />
              ) : (
                <span>PDF</span>
              )}
              <small>{asset.alt || asset.url.split("/").pop()}</small>
            </button>
          ))}
      </div>
      {!assets.length && !error && (
        <p className="muted">No uploads yet. Add your own images when ready.</p>
      )}
    </div>
  );
}
