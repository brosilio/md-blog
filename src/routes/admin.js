const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const Post = require("../controllers/post");

const blogName = process.env.BLOG_NAME;
const SAFE_SLUG = /^[a-z0-9-]+$/;
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
	const { slug, postTitle, tags, draft, extraMeta, content, action } =
		req.body;
	const forceDraft = action === "preview" || draft === "yes";

	if (!slug || !SAFE_SLUG.test(slug)) {
		return res.status(400).render("admin-editor", {
			blogName,
			title: "New Post",
			slug: slug || "",
			isNew: true,
			error: "Slug must contain only lowercase letters, digits, and hyphens.",
			postTitle: postTitle || "",
			tags: tags || "",
			draft: forceDraft,
			extraMeta: extraMeta || "",
			content: content || "",
		});
	}

	const result = await Post.createPost(slug, {
		postTitle,
		tags,
		draft: forceDraft,
		extraMeta,
		content,
	});

	if (result.error) {
		return res.status(409).render("admin-editor", {
			blogName,
			title: "New Post",
			slug,
			isNew: true,
			error: result.error,
			postTitle: postTitle || "",
			tags: tags || "",
			draft: forceDraft,
			extraMeta: extraMeta || "",
			content: content || "",
		});
	}

	return res.redirect(`/post/${slug}`);
});

router.get("/post/:slug/edit", requireAuth, async (req, res) => {
	const { slug } = req.params;
	if (!SAFE_SLUG.test(slug)) return res.status(400).send("Invalid slug");

	const post = await Post.GetPostBySlug(slug, true);
	if (!post) return res.status(404).send("Post not found");

	res.render("admin-editor", {
		blogName,
		title: `Edit: ${slug}`,
		slug,
		isNew: false,
		error: null,
		...Post.extractFields(post.metadata),
		content: post.content,
	});
});

router.post("/post/:slug/edit", requireAuth, parseBody, async (req, res) => {
	const { slug } = req.params;
	if (!SAFE_SLUG.test(slug)) return res.status(400).send("Invalid slug");

	const { postTitle, tags, draft, extraMeta, content, action } = req.body;
	const forceDraft = action === "preview" || draft === "yes";
	const saved = await Post.updatePost(slug, {
		postTitle,
		tags,
		draft: forceDraft,
		extraMeta,
		content,
	});

	if (!saved) return res.status(404).send("Post not found");
	return res.redirect(`/post/${slug}`);
});

module.exports = router;
