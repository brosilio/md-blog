require("dotenv").config();
const blogName = process.env.BLOG_NAME;

const fs = require("fs/promises");
const path = require("path");
const MarkdownIt = require("markdown-it");

const express = require("express");
const router = express.Router();
const md = new MarkdownIt();

router.get("/:slug", async (req, res) => {
	const slug = req.params.slug;
	const filePath = path.join(process.env.POST_DIRECTORY, `${slug}.md`);

	try {
		await fs.stat(filePath);
	} catch (error) {
		console.log(error);
		return res.status(404).send("404 post not found");
	}

	const post = await parsePost(filePath);
	const html = md.render(post.content);

	res.render("post", {
		blogName,
		slug: slug,
		title: post.metadata.title,
		content: html,
	});
});

async function parsePost(filePath) {
	let raw = null;
	try {
		raw = await fs.readFile(filePath, "utf-8");
	} catch (error) {
		console.log(`Error loading post: ${error}`);
		return false;
	}

	const [metaBlock, content] = raw.split(/\r?\n\r?\n/, 2);
	const metadata = {};

	if (!content) {
		return {
			metadata: {},
			content: raw,
		};
	}

	metaBlock.split(/\r?\n/).forEach((line) => {
		const [key, ...rest] = line.split(":");
		if (key && rest.length) {
			let val = rest.join(":").trim();

			if (key.trim().toLowerCase() === "tags") {
				val = val
					.split(",")
					.map((tag) => tag.trim())
					.filter((tag) => tag.length > 0);
			}

			metadata[key.trim()] = val;
		}
	});

	return {
		metadata,
		content,
	};
}

module.exports = router;
