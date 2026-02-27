const blogName = process.env.BLOG_NAME;

const Post = require("../controllers/post");
const { getAuthUser } = require("../middleware/auth");
const express = require("express");
const router = express.Router();

router.get("/:slug", async (req, res) => {
	const { slug } = req.params;
	const user = getAuthUser(req);

	const post = await Post.GetPostBySlug(slug, false, !!user);
	if (post === false) {
		return res.status(404).send("404 post not found");
	}

	res.render("post", {
		blogName,
		slug,
		title: post.metadata?.title || slug,
		content: post.content,
		isDraft: post.metadata?.draft === "yes",
		username: user?.username || null,
	});
});

module.exports = router;
