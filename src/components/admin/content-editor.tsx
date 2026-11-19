"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  definitions,
  isSingleton,
  imageSchema,
  str,
  type CollectionName,
  type Content,
  type Field,
  type GalleryItem,
  type Value,
} from "@/lib/cms/model";
import { adminApi } from "./api";
import { RichEditor } from "./rich-editor";
import { MediaPicker } from "./media-picker";
function defaults(name: CollectionName): Record<string, Value> {
  return Object.fromEntries(
    (definitions[name].fields as Field[]).map((field) => [
      field.key,
      field.kind === "boolean"
        ? ["visible", "indexing", "particles", "animations"].includes(field.key)
        : field.kind === "number"
          ? 0
          : ["list", "gallery"].includes(field.kind)
            ? []
            : field.kind === "color"
              ? "#b46bd6"
              : field.kind === "select"
                ? field.options![0]
                : "",
    ]),
  );
}
function Repeatable({
  values,
  change,
  label,
}: {
  values: string[];
  change: (values: string[]) => void;
  label: string;
}) {
  return (
    <div className="repeatable">
      {values.map((value, i) => (
        <div className="repeatable-row" key={i}>
          <input
            aria-label={`${label} ${i + 1}`}
            value={value}
            onChange={(e) =>
              change(values.map((v, j) => (j === i ? e.target.value : v)))
            }
          />
          <button
            type="button"
            disabled={i === 0}
            aria-label={`Move ${label} ${i + 1} up`}
            onClick={() => {
              const next = [...values];
              [next[i - 1], next[i]] = [next[i], next[i - 1]];
              change(next);
            }}
          >
            ↑
          </button>
          <button
            type="button"
            disabled={i === values.length - 1}
            aria-label={`Move ${label} ${i + 1} down`}
            onClick={() => {
              const next = [...values];
              [next[i], next[i + 1]] = [next[i + 1], next[i]];
              change(next);
            }}
          >
            ↓
          </button>
          <button
            type="button"
            aria-label={`Remove ${label} ${i + 1}`}
            onClick={() => change(values.filter((_, j) => i !== j))}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        className="add-button"
        type="button"
        onClick={() => change([...values, ""])}
      >
        Add item
      </button>
    </div>
  );
}
function GalleryEditor({
  values,
  change,
  setCover,
}: {
  values: GalleryItem[];
  change: (values: GalleryItem[]) => void;
  setCover: (url: string) => void;
}) {
  const [picker, setPicker] = useState(false);
  return (
    <div>
      {values.map((image, i) => (
        <div key={i} className="gallery-edit-row">
          <Image
            src={image.url}
            alt={image.alt || "Screenshot"}
            width={140}
            height={90}
            className="object-contain"
          />
          <div>
            <input
              aria-label={`Screenshot ${i + 1} alt text`}
              placeholder="Alt text"
              value={image.alt}
              onChange={(e) =>
                change(
                  values.map((v, j) =>
                    j === i ? { ...v, alt: e.target.value } : v,
                  ),
                )
              }
            />
            <input
              aria-label={`Screenshot ${i + 1} caption`}
              placeholder="Caption"
              value={image.caption}
              onChange={(e) =>
                change(
                  values.map((v, j) =>
                    j === i ? { ...v, caption: e.target.value } : v,
                  ),
                )
              }
            />
            <div className="row-actions">
              <button type="button" onClick={() => setCover(image.url)}>
                Set as cover
              </button>
              <button
                type="button"
                disabled={!i}
                aria-label={`Move screenshot ${i + 1} up`}
                onClick={() => {
                  const next = [...values];
                  [next[i - 1], next[i]] = [next[i], next[i - 1]];
                  change(next);
                }}
              >
                ↑
              </button>
              <button
                type="button"
                disabled={i === values.length - 1}
                aria-label={`Move screenshot ${i + 1} down`}
                onClick={() => {
                  const next = [...values];
                  [next[i], next[i + 1]] = [next[i + 1], next[i]];
                  change(next);
                }}
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => change(values.filter((_, j) => j !== i))}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => setPicker(!picker)}>
        {picker ? "Close media picker" : "Add screenshot"}
      </button>
      {picker && (
        <MediaPicker
          imagesOnly
          selectMany={(assets) => {
            change([
              ...values,
              ...assets.map((asset) => ({
                url: asset.url,
                alt: asset.alt,
                caption: asset.caption,
              })),
            ]);
            setPicker(false);
          }}
          select={(asset) => {
            change([
              ...values,
              { url: asset.url, alt: asset.alt, caption: asset.caption },
            ]);
            setPicker(false);
          }}
        />
      )}
    </div>
  );
}
export function ContentEditor({ name }: { name: CollectionName }) {
  const [records, setRecords] = useState<Content[]>([]);
  const [active, setActive] = useState<Content | null>(null);
  const [values, setValues] = useState<Record<string, Value>>(defaults(name));
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [sorting, setSorting] = useState("order");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [picker, setPicker] = useState("");
  const [dirty, setDirty] = useState(false);
  const singleton = isSingleton(name);
  const fields = definitions[name].fields as Field[];
  function begin(item: Content | null) {
    setActive(item);
    setValues({
      ...defaults(name),
      ...Object.fromEntries(
        fields
          .filter((f) => item?.[f.key] !== undefined)
          .map((f) => [f.key, item![f.key] as Value]),
      ),
    });
    setEditing(true);
    setError("");
    setPicker("");
    setDirty(false);
  }
  async function load() {
    const items = await adminApi(`content/${name}`);
    setRecords(items);
    return items as Content[];
  }
  useEffect(() => {
    let current = true;
    adminApi(`content/${name}`)
      .then((items: Content[]) => {
        if (!current) return;
        setRecords(items);
        if (isSingleton(name)) {
          const item = items[0] || null;
          setActive(item);
          setValues({
            ...defaults(name),
            ...Object.fromEntries(
              (definitions[name].fields as Field[])
                .filter((f) => item?.[f.key] !== undefined)
                .map((f) => [f.key, item![f.key] as Value]),
            ),
          });
          setEditing(true);
        }
      })
      .catch((e) => current && setError(e.message))
      .finally(() => current && setLoading(false));
    return () => {
      current = false;
    };
  }, [name]);
  useEffect(() => {
    if (!dirty) return;
    const guard = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);
  function change(key: string, value: Value) {
    setValues((v) => ({ ...v, [key]: value }));
    setDirty(true);
    setNotice("");
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const clean = Object.fromEntries(
        Object.entries(values).map(([key, value]) => [
          key,
          Array.isArray(value) &&
          fields.find((f) => f.key === key)?.kind === "list"
            ? (value as string[]).map((v) => v.trim()).filter(Boolean)
            : value,
        ]),
      );
      const record = await adminApi(
        `content/${name}${active ? `/${active._id}` : ""}`,
        active ? "PUT" : "POST",
        {
          values: clean,
          ...(active ? { revision: active.revision || 0 } : {}),
        },
      );
      await load();
      begin(record);
      setNotice("Saved successfully.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(item: Content) {
    if (
      !window.confirm(
        `Delete “${str(item, "title") || str(item, "role") || str(item, "name") || item._id}”? This cannot be undone.`,
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await adminApi(`content/${name}/${item._id}`, "DELETE");
      await load();
      setEditing(false);
      setDirty(false);
      setNotice("Record deleted.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function move(index: number, offset: number) {
    const items = [...records];
    [items[index], items[index + offset]] = [
      items[index + offset],
      items[index],
    ];
    setBusy(true);
    try {
      await adminApi(`reorder/${name}`, "POST", {
        ids: items.map((i) => i._id),
      });
      await load();
      setNotice("Order updated.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const previewHref =
    name === "projects" && active
      ? `/admin/preview/projects/${active.slug}`
      : "/admin/preview";
  let filtered = records.filter(
    (item) =>
      JSON.stringify(item).toLowerCase().includes(query.toLowerCase()) &&
      (!filter ||
        (filter === "visible"
          ? item.visible !== false
          : filter === "hidden"
            ? item.visible === false
            : filter === "published"
              ? item.published === true
              : item.published === false)),
  );
  if (sorting === "title")
    filtered = [...filtered].sort((a, b) =>
      (str(a, "title") || str(a, "role")).localeCompare(
        str(b, "title") || str(b, "role"),
      ),
    );
  if (sorting === "updated")
    filtered = [...filtered].sort((a, b) =>
      str(b, "updatedAt").localeCompare(str(a, "updatedAt")),
    );
  return (
    <>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">CONTENT MANAGEMENT</p>
          <h1>{definitions[name].label}</h1>
        </div>
        {!editing && !singleton && (
          <button className="pill primary" onClick={() => begin(null)}>
            Create entry
          </button>
        )}
      </div>
      {notice && (
        <div role="status" className="toast success">
          {notice}
        </div>
      )}
      {error && (
        <div role="alert" className="toast error">
          {error}
          <button type="button" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      )}
      {loading ? (
        <div className="empty-state">Loading content…</div>
      ) : editing ? (
        <form onSubmit={save} className="content-form">
          <div className="editor-topbar">
            <div>
              <span className="muted">
                {active ? "Editing existing entry" : "New entry"}
                {dirty ? " · Unsaved changes" : ""}
              </span>
            </div>
            <div className="row-actions">
              {!singleton && (
                <button
                  type="button"
                  onClick={() => {
                    if (!dirty || window.confirm("Discard unsaved changes?")) {
                      setEditing(false);
                      setDirty(false);
                    }
                  }}
                >
                  Back to list
                </button>
              )}
              <Link href={previewHref} target="_blank">
                Preview saved content
              </Link>
              <button disabled={busy} className="pill primary" type="submit">
                {busy ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
          <div className="form-fields">
            {fields.map((field) => (
              <div
                key={`${active?._id || "new"}-${field.key}`}
                className={`form-field ${["rich", "list", "gallery"].includes(field.kind) ? "full-width" : ""}`}
              >
                <label htmlFor={`field-${field.key}`}>
                  {field.label}
                  {field.required && " *"}
                </label>
                {field.hint && <p className="field-hint">{field.hint}</p>}
                {field.kind === "rich" ? (
                  <RichEditor
                    key={`${active?._id || "new"}-${field.key}`}
                    label={field.label}
                    value={String(values[field.key] || "")}
                    onChange={(value) => change(field.key, value)}
                  />
                ) : field.kind === "list" ? (
                  <Repeatable
                    values={(values[field.key] as string[]) || []}
                    label={field.label}
                    change={(v) => change(field.key, v)}
                  />
                ) : field.kind === "gallery" ? (
                  <GalleryEditor
                    values={(values[field.key] as GalleryItem[]) || []}
                    change={(v) => change(field.key, v)}
                    setCover={(url) => change("thumbnail", url)}
                  />
                ) : field.kind === "boolean" ? (
                  <label className="checkbox-label">
                    <input
                      id={`field-${field.key}`}
                      type="checkbox"
                      checked={!!values[field.key]}
                      onChange={(e) => change(field.key, e.target.checked)}
                    />
                    <span>{values[field.key] ? "Enabled" : "Disabled"}</span>
                  </label>
                ) : field.kind === "select" ? (
                  <select
                    id={`field-${field.key}`}
                    value={String(values[field.key] || field.options![0])}
                    onChange={(e) => change(field.key, e.target.value)}
                  >
                    {field.options!.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                ) : field.kind === "textarea" ? (
                  <textarea
                    id={`field-${field.key}`}
                    required={field.required}
                    value={String(values[field.key] || "")}
                    onChange={(e) => change(field.key, e.target.value)}
                    rows={4}
                  />
                ) : (
                  <input
                    id={`field-${field.key}`}
                    required={field.required}
                    type={
                      field.kind === "number"
                        ? "number"
                        : field.kind === "color"
                          ? "color"
                          : field.kind === "url" &&
                              !["cvUrl", "pdfUrl"].includes(field.key)
                            ? "url"
                            : "text"
                    }
                    min={field.kind === "number" ? 0 : undefined}
                    value={String(values[field.key] ?? "")}
                    onChange={(e) =>
                      change(
                        field.key,
                        field.kind === "number"
                          ? Number(e.target.value)
                          : e.target.value,
                      )
                    }
                  />
                )}
                {(field.kind === "image" ||
                  (field.kind === "url" &&
                    ["cvUrl", "pdfUrl"].includes(field.key))) && (
                  <>
                    <div className="row-actions">
                      <button
                        type="button"
                        onClick={() =>
                          setPicker(picker === field.key ? "" : field.key)
                        }
                      >
                        {values[field.key]
                          ? "Replace media"
                          : "Choose or upload"}
                      </button>
                      {!!values[field.key] && (
                        <button
                          type="button"
                          onClick={() => change(field.key, "")}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {field.kind === "image" &&
                      !!values[field.key] &&
                      imageSchema.safeParse(values[field.key]).success && (
                        <Image
                          src={String(values[field.key])}
                          alt="Selected media preview"
                          width={200}
                          height={140}
                          className="media-preview object-contain"
                        />
                      )}
                    {picker === field.key && (
                      <MediaPicker
                        imagesOnly={field.kind === "image"}
                        select={(asset) => {
                          change(field.key, asset.url);
                          setPicker("");
                        }}
                      />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="form-footer">
            <button type="submit" disabled={busy} className="pill primary">
              {busy ? "Saving…" : "Save changes"}
            </button>
            {!singleton && active && (
              <button
                type="button"
                disabled={busy}
                className="danger-button"
                onClick={() => remove(active)}
              >
                Delete entry
              </button>
            )}
          </div>
        </form>
      ) : (
        <>
          <div className="admin-filters">
            <input
              aria-label="Search content"
              placeholder="Search entries…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              aria-label="Filter visibility"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="">All entries</option>
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
              {fields.some((f) => f.key === "published") && (
                <>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </>
              )}
            </select>
            <select
              aria-label="Sort entries"
              value={sorting}
              onChange={(e) => setSorting(e.target.value)}
            >
              <option value="order">Display order</option>
              <option value="title">Title</option>
              <option value="updated">Recently updated</option>
            </select>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Entry</th>
                  <th>Status</th>
                  <th>Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const index = records.findIndex((r) => r._id === item._id);
                  return (
                    <tr key={item._id}>
                      <td>
                        <strong>
                          {str(item, "title") || str(item, "role") || item._id}
                        </strong>
                        <small>
                          {str(item, "organization") ||
                            str(item, "category") ||
                            str(item, "eyebrow")}
                        </small>
                      </td>
                      <td>
                        <span className="table-status">
                          {item.visible === false
                            ? "Hidden"
                            : item.published === false
                              ? "Draft"
                              : "Visible"}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            disabled={
                              busy ||
                              index === 0 ||
                              sorting !== "order" ||
                              !!query ||
                              !!filter
                            }
                            aria-label={`Move ${str(item, "title") || str(item, "role")} up`}
                            onClick={() => move(index, -1)}
                          >
                            ↑
                          </button>
                          <button
                            disabled={
                              busy ||
                              index === records.length - 1 ||
                              sorting !== "order" ||
                              !!query ||
                              !!filter
                            }
                            aria-label={`Move ${str(item, "title") || str(item, "role")} down`}
                            onClick={() => move(index, 1)}
                          >
                            ↓
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button onClick={() => begin(item)}>Edit</button>
                          {name === "projects" && (
                            <Link
                              href={`/admin/preview/projects/${item.slug}`}
                              target="_blank"
                            >
                              Preview
                            </Link>
                          )}
                          <button
                            disabled={busy}
                            className="danger-button"
                            onClick={() => remove(item)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!filtered.length && (
              <p className="empty-state">
                No entries found. Create an entry to get started.
              </p>
            )}
          </div>
        </>
      )}
    </>
  );
}
