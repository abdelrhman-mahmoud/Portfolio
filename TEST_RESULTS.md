# Verification — 19 November 2026

The implementation was exercised locally with Node.js 24, Chrome, and an isolated temporary MongoDB instance. After the updated `.env` configuration, live MongoDB Atlas connectivity succeeded: 56 initial content documents were inserted and the first admin was initialized using the supplied environment credentials. The live homepage rendered all 13 projects; login, dashboard reads, and logout were verified against Atlas. Secrets were not displayed or modified. Uploads now use MongoDB GridFS like the supplied Crab Plus reference. Live Atlas upload, image retrieval and deletion succeeded with a temporary test file that was removed afterward. No Blob token is required. The production site URL remains unconfigured.

| Check                                   | Result                                                                                                                |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Dependency installation and lockfile    | Passed                                                                                                                |
| ESLint                                  | Passed, no warnings                                                                                                   |
| Next route type generation + TypeScript | Passed                                                                                                                |
| Production build                        | Passed                                                                                                                |
| Unit/security tests                     | 10 passed                                                                                                             |
| Browser/database integration suites     | 4 passed in development; 6 passed against the production server                                                       |
| Database initialization/cache           | 2 regression tests passed: empty-database preview and connection replacement after URI changes                        |
| Hydration                               | Injected Trancy/Grammarly root attributes: no hydration errors, mobile menu works                                     |
| Session-expiry UI                       | An expired session redirects to login when saving a form                                                              |
| Database outage UI                      | Recovery screen, retry, valid noindex metadata, and accessible login verified against an unreachable database         |
| Seed idempotence                        | First run: 56 inserts; second run: 0; an edited field was preserved                                                   |
| First-admin bootstrap                   | Argon2id password hash confirmed; repeated bootstrap rejected                                                         |
| Authentication                          | Successful login; protected pages/APIs reject anonymous users                                                         |
| Session security                        | Expiry enforced; logout deletes session; replaying the old cookie is rejected                                         |
| CSRF and rate limits                    | Foreign origins rejected; repeated bad logins return 429                                                              |
| Content persistence                     | Project create/edit/publish/reorder/delete; profile, about, experience and skill edits persisted                      |
| Private drafts                          | Anonymous project detail returns 404; authenticated preview works; published project returns 200                      |
| Stale edits                             | Outdated revision rejected with 409                                                                                   |
| Admin form                              | Project created through the browser form and saved to MongoDB                                                         |
| Public rendering                        | Database edits appear publicly; project filtering and detail routes work                                              |
| Mobile layout                           | Homepage, menu, digital card, and admin reviewed at 390px; no horizontal document overflow                            |
| Missing/broken project links            | Optional source/demo buttons absent; project page has no broken image elements                                        |
| Upload validation                       | Wrong MIME, mismatched image bytes, SVG, oversize files, malformed PDFs rejected; valid PNG re-encoded to WebP        |
| Missing storage credentials             | No Blob token required; authenticated uploads use GridFS; anonymous uploads rejected                                  |
| MongoDB failure behavior                | Missing URI fails clearly; unreachable connection fails within configured timeout and clears cached failed connection |
| SEO                                     | Dynamic metadata/sharing image, sitemap and robots checked; admin excluded from sitemap and marked noindex            |
| Previous owner cleanup                  | Identity/links/assets removed; accurate shared-paper co-author attribution retained                                   |
| Production dependency audit             | 0 known vulnerabilities                                                                                               |

The full development dependency audit reports four moderate findings through the existing shadcn CLI / ts-morph / minimatch toolchain. `npm audit fix` applied compatible updates. The remaining automatic fix recommends a breaking shadcn downgrade; it was not applied. The deployed production dependency audit has no findings. A Zod override also removes the vulnerable transitive version from Vercel's CLI-config dependency.

## Requires your configuration

- **Atlas storage:** live authenticated upload, public image retrieval and deletion were verified against the configured Atlas cluster. The isolated browser suite additionally verifies portrait replacement, multiple screenshots, cover selection, ordering, certificate images/PDFs, byte ranges, referenced-file protection, and deletion of GridFS chunks.
- **Deployment/domain:** no Vercel deployment or DNS changes were performed. Follow VERCEL_DEPLOYMENT.md and keep the final domain stable for printed QR codes.
- **Personal media:** upload your portrait, project screenshots and certificates through admin. Verification used temporary synthetic images and did not change your live profile or project content.
- **External links:** the supplied CV and social URLs are used exactly; this does not prove sharing permissions, downloadable CV access, or future availability of external services.
- **Courses/publications:** courses remain unverified by default. Publication 1 uses your supplied metadata. Publication 2's title, authors, venue, year, DOI and links were checked against [ACL Anthology](https://aclanthology.org/2026.arabicnlp-sharedtasks.96/).

Uploaded media URLs are public even when attached to drafts. Private preview protects content records, not the public media URLs. Uploads have a 4 MB limit; PDFs receive basic structural validation rather than antivirus scanning. Manual cropping and analytics were not added. Per-collection table queries currently cap at 1,000 records, suitable for this personal portfolio.

Normal administration requires no direct database edits. The CLI is needed only for initial seeding and admin creation/password recovery.

## Problems corrected in the follow-up review

- Root attributes inserted by translation/grammar browser extensions triggered development hydration warnings. Suppression is limited to html/body attributes; descendant mismatches still surface.
- An entirely empty configured database rendered a blank portfolio. Initial setup content now renders until records are seeded. Initialized empty/hidden collections remain empty.
- A cached MongoDB pool could retain the previous URI after .env changes. URI changes replace and close the previous pool.
- Database failures during metadata generation bypassed normal page recovery. Metadata now falls back to the supplied identity with noindex while content displays its error boundary.
- The recovery button used the former reset prop. It now uses this Next.js version's retry API.
- Session-expiry redirects thrown inside asynchronous form handlers could be caught as form errors. They now navigate to a fixed same-origin login URL.

Pending configuration: set `NEXT_PUBLIC_SITE_URL` for deployment. New uploads require only the existing `MONGODB_URI`. MongoDB connectivity, initial content, and admin initialization are now complete.

## MongoDB GridFS media implementation

The supplied `crap-plus/backend/app.py` stores uploads in GridFS. The portfolio now follows the same approach with the existing MongoDB Node.js driver. Files are chunked in `portfolioMedia.files` / `portfolioMedia.chunks`; `mediaAssets` stores metadata and stable `/api/media/[id]` URLs. Images remain decoded/re-encoded and uploads stay protected by admin sessions, CSRF checks and rate limits. Legacy Blob URLs remain readable, and deletion of an existing Blob object still needs its original token.

The multi-file picker supports project gallery uploads. The production suite confirmed optimized Next.js image loading from the new URLs, portrait replacement, gallery cover selection/reordering, PDFs with ranges/ETags, and cleanup of a multi-chunk file. All six browser scenarios, both database regression tests, ten unit tests, lint, TypeScript and the production build passed.
