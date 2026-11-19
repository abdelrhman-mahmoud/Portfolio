import { test, expect } from "@playwright/test";
import { MongoClient } from "mongodb";
import { randomUUID } from "node:crypto";
const headers = (base: string) => ({ origin: base, "x-portfolio-admin": "1" });
test("public pages, project filtering, detail pages, digital card and mobile navigation", async ({
  page,
  baseURL,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Abdelrhman Mahmoud\./ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "AI & Generative AI Engineer",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.locator('a[href="https://wa.me/201151542228"]').first(),
  ).toBeVisible();
  const featured = page.locator("#featured");
  await featured
    .getByPlaceholder("Search projects or technology")
    .fill("NotebookLM");
  await expect(featured.locator(".project-card")).toHaveCount(1);
  await featured.getByRole("link", { name: /NotebookLM Light/ }).click();
  await expect(
    page.getByRole("heading", { name: "NotebookLM Light", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Live demo", exact: true }),
  ).toHaveCount(0);
  const brokenImages = await page
    .locator("img")
    .evaluateAll(
      (images) =>
        images.filter(
          (i) =>
            !(i as HTMLImageElement).complete ||
            (i as HTMLImageElement).naturalWidth === 0,
        ).length,
    );
  expect(brokenImages).toBe(0);
  await page.goto("/card");
  await expect(page.getByRole("link", { name: "View CV" })).toHaveAttribute(
    "href",
    /18VlxFwhzLuk9mhzlltSqqpKd0Uj8-Aut/,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(
    page.getByRole("navigation", { name: "Mobile", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Mobile", exact: true })
    .getByRole("link", { name: "Contact", exact: true })
    .click();
  await expect(page).toHaveURL(/#contact$/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  const robots = await page.request.get("/robots.txt");
  expect(await robots.text()).toContain("/admin");
  const sitemap = await page.request.get("/sitemap.xml");
  expect(await sitemap.text()).not.toContain("/admin");
  const response = await page.request.get(`${baseURL}/opengraph-image`);
  expect(response.ok()).toBeTruthy();
});
test("unauthorized reads, writes, uploads, preview and CSRF are protected", async ({
  page,
  request,
  baseURL,
}) => {
  const base = baseURL!;
  expect((await request.get("/api/admin/content/projects")).status()).toBe(401);
  for (const [url, method] of [
    ["/api/admin/content/projects", "POST"],
    ["/api/admin/content/projects/anything", "PUT"],
    ["/api/admin/content/projects/anything", "DELETE"],
    ["/api/admin/reorder/projects", "POST"],
    ["/api/admin/media", "POST"],
    ["/api/admin/media/anything", "PATCH"],
    ["/api/admin/media/anything", "DELETE"],
  ]) {
    const response = await request.fetch(url, {
      method,
      headers: headers(base),
      data: {},
    });
    expect(response.status()).toBe(401);
  }
  expect(
    (
      await request.post("/api/admin/auth", {
        headers: { origin: "https://evil.test", "x-portfolio-admin": "1" },
        data: { email: "test@test.test", password: "irrelevant" },
      })
    ).status(),
  ).toBe(403);
  await page.goto("/admin/projects");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto("/admin/preview");
  await expect(page).toHaveURL(/\/admin\/login$/);
});
test("admin authenticates, creates drafts, edits content, publishes, reorders, deletes and revokes logout sessions", async ({
  page,
  baseURL,
}) => {
  await page.goto("/admin/login");
  await page
    .getByLabel("Email", { exact: true })
    .fill(process.env.ADMIN_EMAIL!);
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(
    page.getByRole("heading", { name: "Portfolio overview" }),
  ).toBeVisible();
  await page.screenshot({ path: "output/admin-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({ path: "output/admin-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1280, height: 900 });
  const cookieBeforeLogout = await page.context().cookies();
  const request = page.request;
  const h = headers(baseURL!);
  const slug = `test-project-${randomUUID()}`;
  const response = await request.post("/api/admin/content/projects", {
    headers: h,
    data: {
      values: {
        title: "Integration test project",
        slug,
        published: false,
        visible: true,
        featured: true,
        shortDescription: "Private draft",
        category: "Testing",
        status: "Prototype",
        description:
          "<p>Draft <strong>case study</strong></p><script>alert(1)</script>",
        technologies: ["TypeScript"],
        gallery: [],
      },
    },
  });
  expect(response.status()).toBe(201);
  let project = await response.json();
  expect(project.description).not.toContain("script");
  const anonymous = await page.context().browser()!.newContext();
  expect((await anonymous.request.get(`/projects/${slug}`)).status()).toBe(404);
  await page.goto(`/admin/preview/projects/${slug}`);
  await expect(
    page.getByRole("heading", { name: "Integration test project" }),
  ).toBeVisible();
  const saved = await request.put(
    `/api/admin/content/projects/${project._id}`,
    {
      headers: h,
      data: {
        revision: project.revision,
        values: {
          title: "Integration test project",
          slug,
          published: true,
          visible: true,
          featured: true,
          category: "Testing",
          status: "Prototype",
        },
      },
    },
  );
  expect(saved.ok()).toBeTruthy();
  project = await saved.json();
  expect((await anonymous.request.get(`/projects/${slug}`)).status()).toBe(200);
  const stale = await request.put(
    `/api/admin/content/projects/${project._id}`,
    { headers: h, data: { revision: 0, values: { title: "Stale", slug } } },
  );
  expect(stale.status()).toBe(409);
  const records = await (
    await request.get("/api/admin/content/projects")
  ).json();
  const ids = records.map((p: { _id: string }) => p._id).reverse();
  expect(
    (
      await request.post("/api/admin/reorder/projects", {
        headers: h,
        data: { ids },
      })
    ).ok(),
  ).toBeTruthy();
  const reordered = await (
    await request.get("/api/admin/content/projects")
  ).json();
  expect(reordered.map((p: { _id: string }) => p._id)).toEqual(ids);
  for (const [name, field, value] of [
    ["profile", "title", "AI & Generative AI Engineer"],
    ["about", "description", "<p>Updated about <strong>verified</strong></p>"],
    ["experiences", "role", "Verified test role"],
    ["skills", "title", "Verified skills"],
  ]) {
    const entries = await (
      await request.get(`/api/admin/content/${name}`)
    ).json();
    const entry = entries[0];
    const { _id, revision, createdAt, updatedAt, ...values } = entry;
    void createdAt;
    void updatedAt;
    const edit = await request.put(`/api/admin/content/${name}/${_id}`, {
      headers: h,
      data: { revision, values: { ...values, [field]: value } },
    });
    expect(edit.status()).toBe(200);
  }
  await page.goto("/admin/projects");
  await expect(
    page.getByRole("heading", { name: "Projects", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Create entry", exact: true }).click();
  await page
    .getByLabel("Title *", { exact: true })
    .fill("Form-created project");
  await page.getByLabel("URL slug *", { exact: true }).fill(`form-${slug}`);
  await page
    .getByRole("button", { name: "Save changes", exact: true })
    .first()
    .click();
  await expect(page.getByRole("status")).toContainText("saved", {
    ignoreCase: true,
  });
  expect(
    (
      await request.post("/api/admin/media", {
        headers: { ...h, "content-type": "image/png" },
        data: Buffer.from("invalid"),
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.delete(`/api/admin/content/projects/${project._id}`, {
        headers: h,
      })
    ).ok(),
  ).toBeTruthy();
  expect((await anonymous.request.get(`/projects/${slug}`)).status()).toBe(404);
  // Database-backed text is rendered by the public server page.
  await page.goto("/");
  await expect(page.getByText("Verified skills", { exact: true })).toHaveCount(
    1,
  );
  await page.goto("/admin");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  expect((await request.get("/api/admin/content/projects")).status()).toBe(401);
  await page.context().addCookies(cookieBeforeLogout);
  expect((await request.get("/api/admin/content/projects")).status()).toBe(401);
  await anonymous.close();
});
test("expired sessions and distributed login rate limits are enforced", async ({
  page,
  baseURL,
}) => {
  const client = await new MongoClient(process.env.MONGODB_URI!).connect();
  try {
    await client.db().collection("rateLimits").deleteMany({});
    await page.goto("/admin/login");
    await page
      .getByLabel("Email", { exact: true })
      .fill(process.env.ADMIN_EMAIL!);
    await page
      .getByLabel("Password", { exact: true })
      .fill(process.env.ADMIN_PASSWORD!);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await page.goto("/admin/projects");
    await page
      .getByRole("button", { name: "Create entry", exact: true })
      .click();
    await page
      .getByLabel("Title *", { exact: true })
      .fill("Expired session draft");
    await page
      .getByLabel("URL slug *", { exact: true })
      .fill("expired-session-draft");
    await client
      .db()
      .collection("sessions")
      .updateMany({}, { $set: { expiresAt: new Date(0) } });
    expect(
      (await page.request.get("/api/admin/content/projects")).status(),
    ).toBe(401);
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    for (let i = 0; i < 7; i++) {
      const response = await page.request.post("/api/admin/auth", {
        headers: headers(baseURL!),
        data: { email: "rate-limit@example.test", password: "wrong-password" },
      });
      expect(response.status()).toBe(i < 6 ? 401 : 429);
    }
  } finally {
    await client.close();
  }
});

test("translation and grammar extension attributes do not trigger hydration errors", async ({
  page,
  baseURL,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /hydrat/i.test(message.text()))
      errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route(`${baseURL}/`, async (route) => {
    const response = await route.fetch();
    const original = await response.text();
    const modified = original
      .replace(
        'class="dark h-full antialiased"',
        'class="dark h-full antialiased trancy-und"',
      )
      .replace(
        "<body>",
        '<body data-new-gr-c-s-check-loaded="14.1349.0" data-gr-ext-installed="">',
      );
    await route.fulfill({ response, body: modified });
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Abdelrhman Mahmoud\./ }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveClass(/trancy-und/);
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(
    page.getByRole("navigation", { name: "Mobile", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
