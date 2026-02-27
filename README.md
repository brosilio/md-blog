# md-blog

Markdown blog that doesn't suck.

I hate all the bloated, PHP-infested, WordPress shit spread around the internet.
That's why this exists. No bs, no SQL, no plugins that break with every minor
version change. It's just Markdown and nodejs.

## Features

- Write posts in plain Markdown
- Store metadata (title, tags, draft status, whatever else) right in the files
- Renders boring (read: clean) HTML, server-side
- Caches rendered posts; watches the directory for changes
- Unspecific timestamps because who gives a shit
- Sort and filter posts by tag
- Built-in admin panel to create, edit, and preview posts
- Media manager for uploading files to include in posts

## Setup

1. Clone to a box somewhere, install dependencies:

```bash
git clone https://github.com/brosilio/md-blog.git
cd md-blog
npm install
```

2. Configure the environment:
   Copy `example.env` to `.env` and populate the stuff

3. Create an admin account:

```bash
npm run manage-account
```

4. Start it:

```bash
npm start
```

5. Create markdown files in your `POST_DIRECTORY`:

```markdown
title: My Cool Ass Post
tags: blog

## My Cool Ass Post

some junk goes here probably
```

## Metadata

Metadata lives at the top of each post file. The first blank line
(double newline, like HTTP) marks the end of the metadata block.

Supported keys:

- `title` — displayed in the page title and above the post
- `tags` — comma-separated list of tags
- `draft` — set to `yes` to hide the post from public view (admins can still preview it)

Any other `key: value` lines are stored just in case.
