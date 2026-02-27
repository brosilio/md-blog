const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const Post = require("../controllers/post");

const blogName = process.env.BLOG_NAME;
const SAFE_SLUG = /^[a-z0-9-]+$/;
const parseBody = express.urlencoded({ extended: false, limit: "2mb" });

router.get("/trash", requireAuth, async (req, res) => {
	const posts = await Post.getDeletedPosts();
	res.render("admin-trash", {
		blogName,
		title: "Trash",
		username: req.user.username,
		posts,
		error: posts === null ? "Could not read POST_DIRECTORY — check your .env." : null,
	});
});

router.get("/trash/:slug/edit", requireAuth, async (req, res) => {
	const { slug } = req.params;
	if (!SAFE_SLUG.test(slug)) return res.status(400).send("Invalid slug");

	const post = await Post.getDeletedPostRaw(slug);
	if (!post) return res.status(404).send("Post not found");

	res.render("admin-editor", {
		blogName,
		title: `Edit (trash): ${slug}`,
		slug,
		isNew: false,
		isTrash: true,
		formAction: `/admin/trash/${slug}/edit`,
		error: null,
		...Post.extractFields(post.metadata),
		content: post.content,
	});
});

router.post("/trash/:slug/edit", requireAuth, parseBody, async (req, res) => {
	const { slug } = req.params;
	if (!SAFE_SLUG.test(slug)) return res.status(400).send("Invalid slug");

	const { postTitle, tags, draft, extraMeta, content } = req.body;
	const saved = await Post.updateDeletedPost(slug, {
		postTitle,
		tags,
		draft: draft === "yes",
		extraMeta,
		content,
	});

	if (!saved) return res.status(404).send("Post not found");
	return res.redirect("/admin/trash");
});

router.get("/trash/:slug/undelete", requireAuth, async (req, res) => {
	const { slug } = req.params;
	if (!SAFE_SLUG.test(slug)) return res.status(400).send("Invalid slug");
	await Post.undeletePost(slug);
	return res.redirect("/admin/trash");
});

router.get("/trash/:slug/delete", requireAuth, async (req, res) => {
	const { slug } = req.params;
	if (!SAFE_SLUG.test(slug)) return res.status(400).send("Invalid slug");
	await Post.permanentlyDeletePost(slug);
	return res.redirect("/admin/trash");
});

module.exports = router;
