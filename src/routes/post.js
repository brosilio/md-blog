const blogName = process.env.BLOG_NAME;

const Post = require("../controllers/post");
const { getAuthUser } = require("../middleware/auth");
const express = require("express");
const router = express.Router();

router.get("/:slug", async (req, res) => {
	const { slug } = req.params;

	const post = await Post.GetPostBySlug(slug);
	if (post === false) {
		return res.status(404).send("404 post not found");
	}

	const user = getAuthUser(req);

	res.render("post", {
		blogName,
		slug,
		title: post.metadata?.title || slug,
		content: post.content,
		username: user?.username || null,
	});
});

module.exports = router;
