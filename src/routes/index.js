const blogName = process.env.BLOG_NAME;
const footerContent = process.env.FOOTER_CONTENT;

const fs = require("fs/promises");
const path = require("path");
const timestamp = require("../resources/timestamp");
const { getAuthUser } = require("../middleware/auth");

const express = require("express");
const router = express.Router();

async function getPostList(directoryPath) {
	try {
		const files = (await fs.readdir(directoryPath)).filter((x) =>
			x.endsWith(".md")
		);

		const posts = [];
		for (const file of files) {
			const filePath = path.join(directoryPath, file);
			try {
				const stats = await fs.stat(filePath);
				posts.push({
					slug: file.slice(0, -3),
					ts: timestamp.FormatFileTime(stats.mtime),
				});
			} catch {
				// skip unreadable files
			}
		}
		return posts;
	} catch (error) {
		console.error(
			`Error reading directory ${directoryPath}:`,
			error.message
		);
		return null;
	}
}

const POSTS_PER_PAGE = 10;

router.get("/", async (req, res) => {
	const allPosts = await getPostList(process.env.POST_DIRECTORY);
	const user = getAuthUser(req);

	const totalPages = allPosts ? Math.max(1, Math.ceil(allPosts.length / POSTS_PER_PAGE)) : 1;
	const page = Math.min(Math.max(1, parseInt(req.query.page) || 1), totalPages);
	const posts = allPosts
		? allPosts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE)
		: null;

	res.render("index", {
		blogName,
		footer: footerContent,
		title: "Home",
		posts,
		username: user?.username || null,
		page,
		totalPages,
	});
});

module.exports = router;
