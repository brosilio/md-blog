# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start             # Start the server
npm run lint          # Lint JS, CSS, and Markdown files
npm run lint-fix      # Lint and auto-fix with prettier
npm run manage-account  # Create or update the admin account credentials file
```

No test suite exists in this project.

## Environment

Copy `example.env` to `.env` before running. Key variables:

- `POST_DIRECTORY` — absolute path to the directory containing `.md` post files
- `BLOG_NAME`, `FOOTER_CONTENT`, `APP_PORT`, `APP_HOST`, `TIME_LOCALE`
- `CREDENTIALS_FILE` — absolute path to the admin credentials JSON file (managed by `npm run manage-account`)
- `JWT_SECRET` — secret key for signing JWTs; set to a long random string
- `MEDIA_DIRECTORY` — absolute path to the directory where uploaded media files are stored; served publicly at `/media/:filename`

## Architecture

Express app with EJS templates, no database. Posts live as `.md` files on disk outside the repo.

**Request flow:**

- `GET /` → `src/routes/index.js` reads the `POST_DIRECTORY`, lists `.md` files with fuzzy timestamps
- `GET /post/:slug` → `src/routes/post.js` → `src/controllers/post.js` loads `<slug>.md`, parses metadata, renders markdown

**Post parsing** (`src/controllers/post.js`): Metadata is separated from content by the first blank line (double newline). Keys are parsed as `key: value` pairs. `tags` is split on commas. Posts with `draft: yes` are blocked from rendering. Rendered HTML is cached in a `Map`; chokidar watches `POST_DIRECTORY` and evicts cache entries on file changes.

**Timestamps** (`src/resources/timestamp.js`): `FormatFileTime` renders file `mtime` as a human-readable fuzzy time (e.g. "Monday, February 25 2026, like 3pm") — intentionally imprecise.

**Templates** (`src/views/`): EJS partials — `head.ejs`, `header.ejs` are included by all page views. Static assets served from `public/`.

**Auth** (`src/middleware/auth.js`): `requireAuth` middleware reads a `token` httpOnly cookie, verifies it as a JWT, and redirects to `/login` on failure. Login/logout routes live in `src/routes/login.js`; they read credentials from `CREDENTIALS_FILE` (a JSON file managed by `npm run manage-account`). Credentials file format: `{ username, passwordHash, algo, salt }`.

**Admin routes** (`src/routes/admin.js`): `GET/POST /admin/post/new` and `GET/POST /admin/post/:slug/edit` — all protected by `requireAuth`. Slugs are validated against `/^[a-z0-9-]+$/` before any filesystem access. Post edits write directly to `POST_DIRECTORY`; the chokidar watcher in the post controller handles cache eviction automatically.

**Media routes** (`src/routes/media.js`): `GET /admin/media`, `POST /admin/media/upload`, `POST /admin/media/delete/:filename` — all protected by `requireAuth`. Files are uploaded via multer to `MEDIA_DIRECTORY` with sanitized filenames (`/[^a-zA-Z0-9._-]/g` → `_`). Allowed types: images, mp4/webm, mp3/ogg/wav, pdf. 50MB limit. Files are served publicly at `/media/:filename` via `express.static`.

**`src/bin/manage-account.js`**: CLI utility to create or update the single admin account. Prompts for username and password, generates a fresh random salt, and writes the credentials JSON to `CREDENTIALS_FILE`.
