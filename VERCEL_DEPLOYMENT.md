# Deploy to Vercel

This application uses standard Next.js Node.js server functions. No external Express process, Docker service, Ollama runtime or local filesystem storage is required.

1. Put the repository in your own Git account. The provided local directory has no `.git` metadata; initialize/version it in your account when ready. Never commit `.env.local` or secrets.
2. Import it into Vercel and choose Next.js with Node.js 22 or later. Use `npm ci` to install and `npm run build` to build; keep the default Next.js output setting.
3. Create MongoDB Atlas and configure the database/network/user as described in SETUP.md.
4. Media files use GridFS in the same Atlas database. No separate storage service is required.
5. Set the environment variables below for Production and, if needed, a separate Preview database. Do not let untrusted preview branches access production secrets.

| Variable               | Required    | Purpose                                                                      |
| ---------------------- | ----------- | ---------------------------------------------------------------------------- |
| `MONGODB_URI`          | Yes         | Server-only Atlas URI, including database name; also used for GridFS uploads |
| `AUTH_SECRET`          | Yes         | At least 32 random characters; generate `openssl rand -base64 48`            |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Stable HTTPS production origin                                               |

Do not set `ADMIN_PASSWORD` as a permanent Vercel variable. It is only used by the local initialization/recovery CLI.

6. From a trusted local machine with the production Atlas URI configured, run `npm run seed`, then initialize the admin using the password prompt in SETUP.md. The seed is explicit and is not run automatically at build time. Do this before enabling database-backed traffic.
7. Deploy. Visit `/`, one project detail page, `/card` and `/admin`. Sign in and confirm an edit appears publicly. Upload a test image, assign it to a project, replace it, and confirm gallery ordering. Media uploads use your configured MongoDB connection, including in Vercel server functions.
8. In Vercel Project Settings → Domains, add your custom domain and follow the shown DNS records. Wait for HTTPS to be issued. Set `NEXT_PUBLIC_SITE_URL` to that HTTPS origin and redeploy, or set the same canonical origin in admin SEO & Settings. Settings take precedence over the environment variable.
9. Print a QR code using the permanent domain's `/` or `/card` URL. Keep that domain and route stable when moving hosting or updating content. A Vercel preview URL is unsuitable for permanent printed cards.

Authentication uses Argon2id password hashes and Jose-signed session cookies linked to hashed session IDs in MongoDB. Cookies use HttpOnly, SameSite=Strict and Secure plus the `__Host-` prefix in production. Server-side expiration and revoked sessions are checked on every protected page/API. Mutations require an exact same-origin request and a custom header. Login and write limits persist in MongoDB across serverless invocations. TTL cleanup is not relied on for authorization expiry.

If you proxy the application through another service, preserve the trusted request origin consistently; mismatched origins intentionally reject writes. Vercel-managed forwarding identifies login IP buckets. Outside Vercel, login attempts share a conservative global IP bucket, plus per-account limits.

After deployment, use `/admin` for content changes. Keep dependency updates and database backups as routine maintenance. Re-run lint, type checks, tests and build before changing application code. No deployment has been performed by this local implementation task.
