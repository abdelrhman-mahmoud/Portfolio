# Local setup

Use Node.js 22 or later and npm. Run `npm ci`, then `cp .env.example .env.local`.

## MongoDB Atlas

1. Create an Atlas cluster and an application database user with read/write access limited to a dedicated portfolio database.
2. Set an Atlas network access policy permitting your local machine and production application egress. Use restricted access where your hosting plan supports stable egress; keep database credentials strong and scoped.
3. Copy the connection string into `MONGODB_URI`, including a database name: `mongodb+srv://USER:PASSWORD@CLUSTER/portfolio?retryWrites=true&w=majority`. URL-encode special password characters.
4. Generate `AUTH_SECRET` with `openssl rand -base64 48` and put the result in `.env.local`.
5. Run `npm run seed`. This creates indexes, session/rate-limit TTL indexes, and initial records using `$setOnInsert`. Repeating it does not duplicate records or overwrite edited content. It restores a deleted seeded entry if you run it again; use hide/unpublish to keep a seeded entry absent across seed runs.

The seed has 56 initial documents across 13 content/settings collections. No admin password is seeded. Collections include `profile`, `about`, `skills`, `experiences`, `projects`, `publications`, `education`, `certifications`, `training`, `contact`, `sectionSettings`, `appearance`, `siteSettings`, plus `adminUsers`, `sessions`, `rateLimits`, `mediaAssets`, and `auditLogs`.

## First admin

Use a password manager to create a unique password of at least 14 characters. In Bash, read it without echoing it or putting it in shell history:

```bash
export ADMIN_EMAIL='abdo.elsaadny74@gmail.com'
read -rsp 'New admin password: ' ADMIN_PASSWORD
printf '\n'
export ADMIN_PASSWORD
npm run admin:create
unset ADMIN_PASSWORD ADMIN_EMAIL
```

There is no public registration, web bootstrap endpoint, default credential, or hardcoded password. The CLI atomically inserts a single owner record; repeating initialization fails safely. Login at `/admin` after `npm run dev`.

To recover access, set the same email and a new password with the shell prompts above, run `npm run admin:reset`, then unset the variables. Password resets revoke all sessions. You need database credentials on the machine running this CLI. Rotating `AUTH_SECRET` invalidates all signed cookies as well.

## Media storage

Uploads use **MongoDB GridFS**, following the local Crab Plus reference. The existing `MONGODB_URI` is the only storage configuration required. Files are stored as chunks in `portfolioMedia.files` and `portfolioMedia.chunks`; `mediaAssets` contains URLs and metadata. No Blob account or token is needed for new uploads.

All uploads are authenticated and validated server-side. Images and PDFs are public presentation assets, including files attached to draft projects. The public `/api/media/[id]` route streams the file from GridFS, with caching, ETags, and byte-range support for PDFs. PDFs are delivered with a restrictive sandbox policy.

The upload limit is 4 MB to fit Vercel function request limits. Accepted types: JPEG, PNG, WebP, PDF. Images are decoded, dimension-limited, auto-oriented, resized to at most 2400 pixels and re-encoded as WebP with metadata stripped. SVG and arbitrary binary formats are rejected. PDF magic/header/end markers are checked; no antivirus scanning is provided. Media files are never written to the application filesystem.

Select files in the Media Library or directly in an image/gallery/PDF field. Galleries support selecting multiple files in one operation. Image fields accept media-library paths or existing Blob image URLs. External CV links (including the supplied Google Drive URL) continue to work. If an older Blob file exists, its original token is needed only to permanently delete it; it is not needed for MongoDB uploads.

## Run

```bash
npm run dev
# Or production:
npm run build
npm start
```

Open the printed local URL. Without credentials you can inspect the public seed fallback, but persistence, login and uploads require configuration. No email provider is needed; contact actions use email and WhatsApp.
