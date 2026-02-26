require("dotenv").config();
const blogName = process.env.BLOG_NAME;

const Post = require("../controllers/post");
const jwt = require("jsonwebtoken");
const express = require("express");
const router = express.Router();

router.get("/:slug", async (req, res) => {
	const slug = req.params.slug;

	const post = await Post.GetPostBySlug(slug);
	if (post === false) {
		return res.status(404).send("404 post not found");
	}

	let username = null;
	try {
		const decoded = jwt.verify(req.cookies?.token, process.env.JWT_SECRET);
		username = decoded?.username || null;
	} catch {
		// not logged in
	}

	res.render("post", {
		blogName,
		slug: slug,
		title: post.metadata?.title || slug,
		content: post.content,
		username,
	});
});

module.exports = router;
