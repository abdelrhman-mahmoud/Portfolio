import { test, expect } from "@playwright/test";
import sharp from "sharp";
import { randomBytes, randomUUID } from "node:crypto";
import { MongoClient, ObjectId } from "mongodb";

test("MongoDB uploads: portrait replacement, multiple project screenshots, certificates, PDF ranges and deletion", async ({
  page,
  baseURL,
}) => {
  test.setTimeout(120000);
  const headers = { origin: baseURL!, "x-portfolio-admin": "1" };
  expect(
    (
      await page.request.post("/api/admin/auth", {
        headers,
        data: {
          email: process.env.ADMIN_EMAIL,
          password: process.env.ADMIN_PASSWORD,
        },
      })
    ).ok(),
  ).toBeTruthy();
  const red = await sharp({
    create: { width: 80, height: 60, channels: 3, background: "#ff0000" },
  })
    .png()
    .toBuffer();
  const blue = await sharp({
    create: { width: 90, height: 70, channels: 3, background: "#0000ff" },
  })
    .png()
    .toBuffer();
  const payload = (buffer: Buffer, name = "image.png") => ({
    name,
    mimeType: "image/png",
    buffer,
  });

  await page.goto("/admin/profile");
  const portrait = page
    .locator(".form-field")
    .filter({ has: page.locator('label[for="field-photo"]') });
  await portrait
    .getByRole("button", { name: "Choose or upload", exact: true })
    .click();
  await portrait.locator('input[type="file"]').setInputFiles(payload(red));
  await expect(page.locator("#field-photo")).toHaveValue(/^\/api\/media\//);
  const firstPortrait = await page.locator("#field-photo").inputValue();
  await page
    .getByRole("button", { name: "Save changes", exact: true })
    .first()
    .click();
  await expect(page.getByRole("status")).toContainText("Saved successfully");
  await portrait
    .getByRole("button", { name: "Replace media", exact: true })
    .click();
  await portrait.locator('input[type="file"]').setInputFiles(payload(blue));
  await expect(page.locator("#field-photo")).not.toHaveValue(firstPortrait);
  const secondPortrait = await page.locator("#field-photo").inputValue();
  await page
    .getByRole("button", { name: "Save changes", exact: true })
    .first()
    .click();
  await expect(page.getByRole("status")).toContainText("Saved successfully");
  await page.goto("/");
  await expect(page.locator(".hero-core img")).toHaveAttribute(
    "src",
    /api%2Fmedia/,
  );
  await page.waitForFunction(() => {
    const img = document.querySelector<HTMLImageElement>(".hero-core img");
    return img?.complete && img.naturalWidth > 0;
  });
  expect(
    (
      await page.request.delete(
        `/api/admin/media/${secondPortrait.split("/").pop()}`,
        { headers },
      )
    ).status(),
  ).toBe(409);
  expect(
    (
      await page.request.delete(
        `/api/admin/media/${firstPortrait.split("/").pop()}`,
        { headers },
      )
    ).ok(),
  ).toBeTruthy();

  const slug = `media-project-${randomUUID()}`;
  await page.goto("/admin/projects");
  await page.getByRole("button", { name: "Create entry", exact: true }).click();
  await page.getByLabel("Title *", { exact: true }).fill("Media gallery test");
  await page.getByLabel("URL slug *", { exact: true }).fill(slug);
  await page.locator("#field-published").check();
  await page
    .getByRole("button", { name: "Add screenshot", exact: true })
    .click();
  const gallery = page
    .locator(".form-field")
    .filter({ has: page.locator('label[for="field-gallery"]') });
  await gallery
    .locator('input[type="file"]')
    .setInputFiles([payload(red, "red.png"), payload(blue, "blue.png")]);
  await expect(page.locator(".gallery-edit-row")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Set as cover", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Move screenshot 2 up", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Save changes", exact: true })
    .first()
    .click();
  await expect(page.getByRole("status")).toContainText("Saved successfully");
  const projects = await (
    await page.request.get("/api/admin/content/projects")
  ).json();
  const project = projects.find((p: { slug: string }) => p.slug === slug);
  expect(project.gallery).toHaveLength(2);
  expect(project.thumbnail).toBe(project.gallery[1].url);
  expect(
    (
      await page.request.delete(
        `/api/admin/media/${project.gallery[0].url.split("/").pop()}`,
        { headers },
      )
    ).status(),
  ).toBe(409);
  await page.goto(`/projects/${slug}`);
  await expect(
    page.getByRole("heading", { name: "Media gallery test", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".gallery-grid img")).toHaveCount(2);
  await page.waitForFunction(() =>
    [...document.querySelectorAll<HTMLImageElement>("main img")].every(
      (img) => img.complete && img.naturalWidth > 0,
    ),
  );

  const pdf = Buffer.from(
    "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Count 0 /Kids [] >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n",
  );
  const pdfResponse = await page.request.post("/api/admin/media", {
    headers: { ...headers, "content-type": "application/pdf" },
    data: pdf,
  });
  expect(pdfResponse.status()).toBe(201);
  const pdfAsset = await pdfResponse.json();
  const certificates = await (
    await page.request.get("/api/admin/content/certifications")
  ).json();
  const { _id, createdAt, updatedAt, revision, ...values } = certificates[0];
  void createdAt;
  void updatedAt;
  expect(
    (
      await page.request.put(`/api/admin/content/certifications/${_id}`, {
        headers,
        data: {
          revision,
          values: { ...values, image: secondPortrait, pdfUrl: pdfAsset.url },
        },
      })
    ).ok(),
  ).toBeTruthy();
  const download = await page.request.get(pdfAsset.url);
  expect(download.headers()["content-type"]).toBe("application/pdf");
  expect(download.headers()["content-security-policy"]).toContain("sandbox");
  expect(await download.body()).toEqual(pdf);
  const range = await page.request.get(pdfAsset.url, {
    headers: { range: "bytes=0-9" },
  });
  expect(range.status()).toBe(206);
  expect(await range.body()).toEqual(pdf.subarray(0, 10));
  const suffix = await page.request.get(pdfAsset.url, {
    headers: { range: "bytes=-6" },
  });
  expect(await suffix.body()).toEqual(pdf.subarray(-6));
  expect(
    (
      await page.request.get(pdfAsset.url, {
        headers: { range: "bytes=999999-" },
      })
    ).status(),
  ).toBe(416);
  expect(
    (
      await page.request.get(pdfAsset.url, {
        headers: { "if-none-match": download.headers().etag },
      })
    ).status(),
  ).toBe(304);
  expect((await page.request.get(`/api/media/${randomUUID()}`)).status()).toBe(
    404,
  );

  const large = await sharp(randomBytes(800 * 800 * 3), {
    raw: { width: 800, height: 800, channels: 3 },
  })
    .png()
    .toBuffer();
  const largeResponse = await page.request.post("/api/admin/media", {
    headers: { ...headers, "content-type": "image/png" },
    data: large,
  });
  expect(largeResponse.status()).toBe(201);
  const image = await largeResponse.json();
  const client = await new MongoClient(process.env.MONGODB_URI!).connect();
  try {
    const db = client.db();
    expect(
      await db
        .collection("portfolioMedia.chunks")
        .countDocuments({ files_id: new ObjectId(image.storageKey) }),
    ).toBeGreaterThan(1);
    const imageBytes = await (await page.request.get(image.url)).body();
    expect((await sharp(imageBytes).metadata()).width).toBe(800);
    expect(
      (
        await page.request.delete(`/api/admin/media/${image._id}`, { headers })
      ).ok(),
    ).toBeTruthy();
    expect(
      await db
        .collection("portfolioMedia.files")
        .countDocuments({ _id: new ObjectId(image.storageKey) }),
    ).toBe(0);
    expect(
      await db
        .collection("portfolioMedia.chunks")
        .countDocuments({ files_id: new ObjectId(image.storageKey) }),
    ).toBe(0);
  } finally {
    await client.close();
  }
  expect(
    (
      await page.request.delete(`/api/admin/content/projects/${project._id}`, {
        headers,
      })
    ).ok(),
  ).toBeTruthy();
  expect(
    (
      await page.request.delete(
        `/api/admin/media/${project.gallery[0].url.split("/").pop()}`,
        { headers },
      )
    ).ok(),
  ).toBeTruthy();
});
