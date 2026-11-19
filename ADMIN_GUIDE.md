# Managing your portfolio

Sign in at `/admin` with the account created by the CLI. Sessions expire after eight hours. Sign out when finished; logout revokes the session in MongoDB and removes the HttpOnly cookie. Password recovery is a CLI operation described in SETUP.md.

## Edit and publish

Choose a section in the sidebar. Collection screens support search, visibility/publishing filters, sorting, edit and delete actions. Create entry opens a form specific to that collection. All content changes persist to MongoDB after **Save changes**. Required fields and server validation failures appear in the form. Save conflicts are rejected when another tab has edited the same record; reload to get the latest version.

Use the up/down controls in display-order view to change record order. Clear searches and filters before reordering. Section order and visibility are managed under **Sections & Navigation**. Navigation labels can be changed or left blank to omit an item from the menu. The footer remains at the end of the page. Hide a section to remove it from the homepage and navigation without deleting its content.

Each project needs a unique, lowercase URL slug. Keep shared slugs stable. Source code, live demo, paper, video, affiliation and date fields are optional. An empty URL produces no button. Status describes the actual state of the work; publishing is a separate switch. New projects/publications start unpublished. **Visible** and **Published** must both be enabled for public records. Unpublished or hidden projects return 404 on their public detail routes and are excluded from the sitemap.

**Preview saved content** opens a private, authenticated preview. Save first; previews reflect saved records, not the current unsaved form. Project previews show drafts and hidden projects. The full portfolio preview includes unpublished/hidden collection records but respects section visibility. Preview pages are marked noindex and never appear in the sitemap.

## Text and lists

The rich text editor supports paragraphs, bold/italic, headings, lists, quotations, links and undo. Formatting is sanitized on saving and again during public rendering. Scripts, embeds, arbitrary styles and event handlers cannot be published.

Use Add item for technologies, skills, work bullets, features, challenges, solutions, outcomes, metrics, authors, keywords and other repeatable text fields. Move items with the up/down controls; remove unwanted items. Do not save blank list rows. Skills are grouped by category with independently ordered names. Add exact names to Hidden skill names to hide individual skills, or hide an entire category with its Visible switch.

Hero identity, name, role, custom introduction, button labels, monogram and capability labels are editable under **Profile & Hero**. About text and strengths have their own screen. Footer text, digital card title, CV and social links are under **Contact & Social Links**. Reorder the link-name list to arrange buttons on `/card` and the contact section (`email`, `whatsapp`, `linkedin`, `github`, `kaggle`, `cv`). Clear a URL to hide its link. The WhatsApp seed uses your latest number, +20 115 154 2228.

## Images, galleries and certificates

Upload your portrait and project images when ready. The site currently uses monogram/project placeholders because no personal images were supplied.

Open **Media Library**, upload a file, and edit its alt text/caption. Image and PDF fields also have Choose or upload buttons. Gallery entries contain independently editable alt text and captions. New gallery selections copy the media library text; later changes to the library text do not overwrite captions in existing projects.

Gallery controls add/remove screenshots, reorder them, and set an image as the project cover. Add screenshot lets you select multiple images from your device at once. Files are stored through your existing MongoDB connection; no additional storage key is needed. Choose Replace media on a single-image field to select another file, then save. Remove clears a reference without deleting the stored file. Delete file in Media Library permanently removes an unused file from storage; referenced files cannot be deleted. Replace/remove references in content first. There is no built-in manual crop tool; images are auto-oriented/resized and previews show how they will render.

Courses are initially **Course / unverified**, with no invented dates, credential identifiers or verification URLs. Only change an entry to **Earned certification** after confirming it. Upload certificate images or PDFs using the matching fields.

## Appearance and SEO

Site Appearance controls gradient accents, background particles and reveal animations. Reduced-motion device preferences are respected. SEO & Settings controls title, description, sharing image, keywords, indexing and canonical origin. Use your permanent domain so printed QR codes remain useful. SEO changes apply on the next request; canonical URLs derive from that domain or `NEXT_PUBLIC_SITE_URL`.

Normal content updates require no source edits or redeployments. The dashboard shows totals and recent edits. Delete asks for confirmation. Keep backups of your Atlas database and original media files.
