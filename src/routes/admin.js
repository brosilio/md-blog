require("dotenv").config();
const fs = require("fs/promises");
const path = require("path");
const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");

const blogName = process.env.BLOG_NAME;
const SAFE_SLUG = /^[a-z0-9-]+$/;

router.get("/post/new", requireAuth, (req, res) => {
	res.render("admin-editor", {
		blogName,
		title: "New Post",
		slug: "",
		rawContent: "",
		isNew: true,
		error: null,
	});
});

router.post(
	"/post/new",
	requireAuth,
	express.urlencoded({ extended: false }),
	async (req, res) => {
		const { slug, rawContent } = req.body;

		if (!slug || !SAFE_SLUG.test(slug)) {
			return res.status(400).render("admin-editor", {
				blogName,
				title: "New Post",
				slug: slug || "",
				rawContent: rawContent || "",
				isNew: true,
				error: "Slug must contain only lowercase letters, digits, and hyphens.",
			});
		}

		const filePath = path.join(process.env.POST_DIRECTORY, `${slug}.md`);

		try {
			await fs.access(filePath);
			return res.status(409).render("admin-editor", {
				blogName,
				title: "New Post",
				slug,
				rawContent: rawContent || "",
				isNew: true,
				error: `A post with slug "${slug}" already exists.`,
			});
		} catch {
			// file does not exist — safe to create
		}

		await fs.writeFile(filePath, rawContent || "", "utf-8");
		return res.redirect(`/post/${slug}`);
	}
);

router.get("/post/:slug/edit", requireAuth, async (req, res) => {
	const { slug } = req.params;
	if (!SAFE_SLUG.test(slug)) return res.status(400).send("Invalid slug");

	const filePath = path.join(process.env.POST_DIRECTORY, `${slug}.md`);

	let rawContent;
	try {
		rawContent = await fs.readFile(filePath, "utf-8");
	} catch {
		return res.status(404).send("Post not found");
	}

	res.render("admin-editor", {
		blogName,
		title: `Edit: ${slug}`,
		slug,
		rawContent,
		isNew: false,
		error: null,
	});
});

router.post(
	"/post/:slug/edit",
	requireAuth,
	express.urlencoded({ extended: false }),
	async (req, res) => {
		const { slug } = req.params;
		if (!SAFE_SLUG.test(slug)) return res.status(400).send("Invalid slug");

		const filePath = path.join(process.env.POST_DIRECTORY, `${slug}.md`);

		try {
			await fs.access(filePath);
		} catch {
			return res.status(404).send("Post not found");
		}

		const { rawContent } = req.body;
		await fs.writeFile(filePath, rawContent || "", "utf-8");
		return res.redirect(`/post/${slug}`);
	}
);

module.exports = router;
