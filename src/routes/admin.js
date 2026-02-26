const fs = require("fs/promises");
const path = require("path");
const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { GetPostBySlug } = require("../controllers/post");

const blogName = process.env.BLOG_NAME;
const SAFE_SLUG = /^[a-z0-9-]+$/;
const KNOWN_KEYS = new Set(["title", "tags", "draft"]);

function extractFields(metadata) {
	const extraLines = Object.entries(metadata)
		.filter(([k]) => !KNOWN_KEYS.has(k.toLowerCase()))
		.map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
		.join("\n");

	return {
		postTitle: metadata.title || "",
		tags: Array.isArray(metadata.tags)
			? metadata.tags.join(", ")
			: metadata.tags || "",
		draft: metadata.draft === "yes",
		extraMeta: extraLines,
	};
}

function buildRawPost({ postTitle, tags, draft, extraMeta, content }) {
	const lines = [];
	if (postTitle && postTitle.trim()) lines.push(`title: ${postTitle.trim()}`);
	if (tags && tags.trim()) lines.push(`tags: ${tags.trim()}`);
	if (draft) lines.push(`draft: yes`);
	if (extraMeta && extraMeta.trim()) {
		extraMeta
			.trim()
			.split(/\r?\n/)
			.forEach((line) => {
				if (line.trim()) lines.push(line.trim());
			});
	}

	if (lines.length > 0) {
		return lines.join("\n") + "\n\n" + (content || "");
	}
	return content || "";
}

const parseBody = express.urlencoded({ extended: false, limit: "2mb" });

const emptyEditor = {
	postTitle: "",
	tags: "",
	draft: false,
	extraMeta: "",
	content: "",
};

router.get("/post/new", requireAuth, (req, res) => {
	res.render("admin-editor", {
		blogName,
		title: "New Post",
		slug: "",
		isNew: true,
		error: null,
		...emptyEditor,
	});
});

router.post("/post/new", requireAuth, parseBody, async (req, res) => {
	const { slug, postTitle, tags, draft, extraMeta, content } = req.body;

	if (!slug || !SAFE_SLUG.test(slug)) {
		return res.status(400).render("admin-editor", {
			blogName,
			title: "New Post",
			slug: slug || "",
			isNew: true,
			error: "Slug must contain only lowercase letters, digits, and hyphens.",
			postTitle: postTitle || "",
			tags: tags || "",
			draft: draft === "yes",
			extraMeta: extraMeta || "",
			content: content || "",
		});
	}

	const filePath = path.join(process.env.POST_DIRECTORY, `${slug}.md`);

	try {
		await fs.access(filePath);
		return res.status(409).render("admin-editor", {
			blogName,
			title: "New Post",
			slug,
			isNew: true,
			error: `A post with slug "${slug}" already exists.`,
			postTitle: postTitle || "",
			tags: tags || "",
			draft: draft === "yes",
			extraMeta: extraMeta || "",
			content: content || "",
		});
	} catch {
		// file does not exist — safe to create
	}

	const rawContent = buildRawPost({
		postTitle,
		tags,
		draft: draft === "yes",
		extraMeta,
		content,
	});
	await fs.writeFile(filePath, rawContent, "utf-8");
	return res.redirect(`/post/${slug}`);
});

router.get("/post/:slug/edit", requireAuth, async (req, res) => {
	const { slug } = req.params;
	if (!SAFE_SLUG.test(slug)) return res.status(400).send("Invalid slug");

	const post = await GetPostBySlug(slug, true);
	if (!post) return res.status(404).send("Post not found");

	const fields = extractFields(post.metadata);

	res.render("admin-editor", {
		blogName,
		title: `Edit: ${slug}`,
		slug,
		isNew: false,
		error: null,
		...fields,
		content: post.content,
	});
});

router.post("/post/:slug/edit", requireAuth, parseBody, async (req, res) => {
	const { slug } = req.params;
	if (!SAFE_SLUG.test(slug)) return res.status(400).send("Invalid slug");

	const filePath = path.join(process.env.POST_DIRECTORY, `${slug}.md`);

	try {
		await fs.access(filePath);
	} catch {
		return res.status(404).send("Post not found");
	}

	const { postTitle, tags, draft, extraMeta, content } = req.body;
	const rawContent = buildRawPost({
		postTitle,
		tags,
		draft: draft === "yes",
		extraMeta,
		content,
	});
	await fs.writeFile(filePath, rawContent, "utf-8");
	return res.redirect(`/post/${slug}`);
});

module.exports = router;
