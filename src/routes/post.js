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
	if (post === false) {
		return res.status(500).send("500 internal server error");
	}

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

	const match = raw.match(/\r?\n\r?\n/);
	let metaBlock = "";
	let content = raw;

	if (match) {
		metaBlock = raw.slice(0, match.index);
		content = raw.slice(match.index + match[0].length);
	} else {
        return raw;
    }

	const metadata = {};
	metaBlock.split(/\r?\n/).forEach((line) => {
		const [key, ...rest] = line.split(":");
		if (key && rest.length) {
			let value = rest.join(":").trim();

			if (key.trim().toLowerCase() === "tags") {
				value = value
					.split(",")
					.map((tag) => tag.trim())
					.filter(Boolean);
			}

			metadata[key.trim()] = value;
		}
	});

	return {
		metadata,
		content,
	};
}

module.exports = router;
