import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { initialContent } from "../src/lib/cms/initial";
import {
  collectionNames,
  contentSchema,
  shown,
  urlSchema,
} from "../src/lib/cms/model";
import { sanitizeRich } from "../src/lib/server/sanitize";
import { validateFile } from "../src/lib/server/media";
import { boundedBody, requireSameOrigin } from "../src/lib/server/security";

test("all supplied seed records validate; projects have unique slugs and no invented deployment links", () => {
  for (const name of collectionNames)
    for (const record of initialContent[name]) {
      const { _id, ...values } = record;
      assert.ok(_id);
      contentSchema(name).parse(values);
    }
  assert.equal(initialContent.projects.length, 13);
  assert.equal(new Set(initialContent.projects.map((p) => p.slug)).size, 13);
  assert.ok(
    initialContent.projects.every((p) => !p.githubUrl && !p.liveDemoUrl),
  );
  assert.ok(
    initialContent.certifications.every(
      (c) => c.status === "Course / unverified",
    ),
  );
  assert.equal(
    initialContent.contact[0].whatsapp,
    "https://wa.me/201151542228",
  );
});
test("rich text strips script, event handlers, unsafe URLs and embeds", () => {
  const cleaned = sanitizeRich(
    '<p onclick="evil()">Hello <strong>world</strong></p><script>alert(1)</script><a href="javascript:alert(1)">bad</a><img src=x onerror=evil()><iframe src="https://evil.test"></iframe>',
  );
  assert.match(cleaned, /<strong>world<\/strong>/);
  assert.doesNotMatch(cleaned, /script|onclick|onerror|javascript|iframe|<img/);
});
test("content validation blocks mass assignment, unsafe URLs and malformed slugs", () => {
  assert.equal(
    contentSchema("projects").safeParse({
      title: "Bad",
      slug: "good",
      role: "Owner",
      passwordHash: "injected",
    }).success,
    false,
  );
  assert.equal(
    contentSchema("projects").safeParse({ title: "Bad", slug: "../escape" })
      .success,
    false,
  );
  assert.equal(urlSchema.safeParse("javascript:alert(1)").success, false);
  assert.equal(
    urlSchema.safeParse("https://user:secret@example.test").success,
    false,
  );
  assert.equal(
    urlSchema.safeParse("https://github.com/abdelrhman-mahmoud").success,
    true,
  );
});
test("hidden and draft content is excluded from public views", () => {
  assert.equal(shown({ _id: "1", published: false }), false);
  assert.equal(shown({ _id: "1", visible: false }), false);
  assert.equal(shown({ _id: "1", visible: true, published: true }), true);
});
test("CSRF guard requires an exact origin and custom admin header", () => {
  assert.throws(() =>
    requireSameOrigin(
      new Request("https://portfolio.test/api/admin/auth", {
        headers: { origin: "https://evil.test", "x-portfolio-admin": "1" },
      }),
    ),
  );
  assert.throws(() =>
    requireSameOrigin(
      new Request("https://portfolio.test/api/admin/auth", {
        headers: { origin: "https://portfolio.test" },
      }),
    ),
  );
  assert.doesNotThrow(() =>
    requireSameOrigin(
      new Request("https://portfolio.test/api/admin/auth", {
        headers: { origin: "https://portfolio.test", "x-portfolio-admin": "1" },
      }),
    ),
  );
});
test("request body limit also rejects chunked oversized input", async () => {
  const request = new Request("https://portfolio.test/", {
    method: "POST",
    body: "x".repeat(100),
  });
  await assert.rejects(boundedBody(request, 50), /too large/);
});
test("uploads reject mismatched types, SVG, oversize files and malformed PDFs", async () => {
  await assert.rejects(validateFile(Buffer.from("<svg/>"), "image/svg+xml"));
  await assert.rejects(validateFile(Buffer.from("not an image"), "image/png"));
  await assert.rejects(
    validateFile(Buffer.from("%PDF-invalid"), "application/pdf"),
  );
  await assert.rejects(
    validateFile(Buffer.alloc(4 * 1024 * 1024 + 1), "image/png"),
  );
  const png = await sharp({
    create: { width: 20, height: 30, channels: 3, background: "#ff0000" },
  })
    .png()
    .toBuffer();
  await assert.rejects(validateFile(png, "image/jpeg"));
  const converted = await validateFile(png, "image/png");
  assert.equal(converted.mimeType, "image/webp");
  assert.equal(converted.width, 20);
  assert.equal(converted.height, 30);
});

test("database configuration fails clearly without credentials or with an unreachable server", async () => {
  const { db, ConfigurationError } = await import("../src/lib/server/db");
  const previous = process.env.MONGODB_URI;
  try {
    delete process.env.MONGODB_URI;
    await assert.rejects(db(), ConfigurationError);
    process.env.MONGODB_URI = "mongodb://127.0.0.1:1/portfolio_unreachable";
    await assert.rejects(db(), /Database connection unavailable/);
    assert.equal(global.portfolioMongo, undefined);
  } finally {
    if (previous === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = previous;
  }
});

test("structured data escapes HTML delimiters without changing JSON values", async () => {
  const { jsonLd } = await import("../src/lib/server/seo");
  const original = { name: "</script><script>alert(1)</script>" };
  const serialized = jsonLd(original);
  assert.ok(!serialized.includes("<"));
  assert.deepEqual(JSON.parse(serialized), original);
});

test("uploaded MongoDB media paths work in portraits, galleries and PDFs without allowing arbitrary local URLs", () => {
  const media = "/api/media/12345678-1234-4567-8123-123456789abc";
  assert.ok(
    contentSchema("profile").safeParse({
      name: "Owner",
      displayName: "Owner",
      photo: media,
    }).success,
  );
  assert.ok(
    contentSchema("projects").safeParse({
      title: "Project",
      slug: "project",
      thumbnail: media,
      gallery: [{ url: media, alt: "Screenshot", caption: "" }],
    }).success,
  );
  assert.ok(
    contentSchema("contact").safeParse({ title: "Contact", cvUrl: media })
      .success,
  );
  assert.ok(
    contentSchema("certifications").safeParse({
      title: "Certificate",
      pdfUrl: media,
    }).success,
  );
  assert.equal(
    contentSchema("projects").safeParse({
      title: "Project",
      slug: "project",
      thumbnail: "/api/admin/auth",
    }).success,
    false,
  );
  assert.equal(
    contentSchema("projects").safeParse({
      title: "Project",
      slug: "project",
      thumbnail: "/api/media/../../admin",
    }).success,
    false,
  );
});
