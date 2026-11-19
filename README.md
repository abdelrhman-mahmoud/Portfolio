# Abdelrhman Mahmoud — portfolio and CMS

A personalized Next.js 16 App Router portfolio for **Abdelrhman Mahmoud Fawzy**, AI & Generative AI Engineer. Includes 13 project case studies, categorized skills, professional experience, research, education, courses, training, contact links, and a mobile digital card at `/card`.

The private `/admin` dashboard edits real MongoDB records through validated server APIs. It supports content CRUD, ordering, visibility, project/publication publishing, sanitized rich text, repeatable fields, private previews, audit history, and a MongoDB GridFS media library. Public content is server rendered on each request. MongoDB connections are cached per runtime. Browser code never receives database or storage credentials.

```bash
npm ci
cp .env.example .env.local
# Configure MongoDB, AUTH_SECRET and media storage through the same MongoDB connection in .env.local.
npm run seed
# Securely initialize the first admin; see SETUP.md.
npm run admin:create
npm run dev
```

Without MongoDB configuration, public pages show the supplied initial content and `/admin/login` shows setup instructions. An entirely empty database also shows the setup content until seeded. Once content is initialized, only database records are used; run the seed before normal administration. A configured database failure is reported rather than silently showing stale seed content.

Read [SETUP.md](SETUP.md), [ADMIN_GUIDE.md](ADMIN_GUIDE.md), and [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md).

## Architecture and changed files

- `src/lib/cms/model.ts`: collection definitions, TypeScript content types, field allowlists and Zod validation shared with the form builder.
- `src/lib/cms/initial-content.json`: seed content and setup fallback; includes the supplied CV/social URLs and updated WhatsApp number.
- `src/lib/server/`: MongoDB connection, repository, seed, Argon2id/Jose authentication, database sessions, distributed limits, sanitization, bounded request parsing, and GridFS validation/storage.
- `src/app/api/admin/`: protected authentication, content, reorder, overview, and media handlers.
- `src/components/admin/`: searchable tables, content-specific forms, Tiptap editors, repeatable lists, galleries, media selection, login, and activity dashboard.
- `src/components/portfolio/`: reusable public sections, filtering, galleries, navigation, project details and business-card links.
- `src/app/`: dynamic homepage, project routes, digital card, CV redirect, private admin/previews, SEO metadata, sitemap, robots, icons and sharing image.
- `scripts/`: idempotent seeding, single-admin initialization/password recovery, and isolated integration test runner.
- `tests/`: validation/security tests and browser/database integration tests.
- `src/app/globals.css`, `next.config.ts`, `package.json`, lockfile, CI and deployment documentation: responsive styling, server configuration, dependencies and checks.

The original dark palette, gradient accents, glass surfaces, particle background, scroll progress, reveal animations, and reusable UI components are retained. Previous-owner content modules, ADAS page, portrait, résumé, certificates, screenshots, CV-generation workflow, and outdated documentation were removed. A previous owner's name remains only in the accurate co-author list of the shared ACL publication.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

The end-to-end runner requires `mongod` and Chromium/Chrome (or `npx playwright install chromium`). It starts an isolated temporary database and web server, creates random test-only credentials, verifies seed idempotence and admin/public behavior, and removes the database afterward. It does not use your Atlas database. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` if necessary. Normal operation and Vercel hosting never require local MongoDB, Docker, or a continuously running backend.

Uploads use the configured Atlas database through GridFS, matching the reference Crab Plus project. No additional storage account or token is required. Deployment still requires your hosting configuration. See [TEST_RESULTS.md](TEST_RESULTS.md) for verification and limits.
