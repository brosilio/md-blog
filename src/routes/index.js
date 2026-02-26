const blogName = process.env.BLOG_NAME;
const footerContent = process.env.FOOTER_CONTENT;

const timestamp = require("../resources/timestamp");
const { getAuthUser } = require("../middleware/auth");
const { getAllPostsMeta } = require("../controllers/post");

const express = require("express");
const router = express.Router();

const POSTS_PER_PAGE = 10;
const SORT_OPTIONS = ["latest", "oldest", "alpha", "random"];

router.get("/", async (req, res) => {
	const allPosts = await getAllPostsMeta();
	const user = getAuthUser(req);

	// Collect all tags before filtering so the full tag list is always shown
	const allTags = allPosts
		? [...new Set(allPosts.flatMap((p) => p.tags))].sort()
		: [];

	const tag = allTags.includes(req.query.tag) ? req.query.tag : null;
	const sort = SORT_OPTIONS.includes(req.query.sort) ? req.query.sort : "latest";

	let posts = allPosts
		? allPosts.filter((p) => !tag || p.tags.includes(tag))
		: null;

	if (posts) {
		if (sort === "latest") posts.sort((a, b) => b.mtime - a.mtime);
		else if (sort === "oldest") posts.sort((a, b) => a.mtime - b.mtime);
		else if (sort === "alpha") posts.sort((a, b) => a.slug.localeCompare(b.slug));
		else if (sort === "random") posts.sort(() => Math.random() - 0.5);

		// Format timestamps for display after sorting (mtime no longer needed)
		posts = posts.map((p) => ({
			slug: p.slug,
			ts: timestamp.FormatFileTime(p.mtime),
		}));
	}

	const totalPages = posts ? Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE)) : 1;
	const page = Math.min(Math.max(1, parseInt(req.query.page) || 1), totalPages);
	const pagePosts = posts
		? posts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE)
		: null;

	res.render("index", {
		blogName,
		footer: footerContent,
		title: "Home",
		posts: pagePosts,
		username: user?.username || null,
		page,
		totalPages,
		sort,
		tag,
		allTags,
	});
});

module.exports = router;
