require("dotenv").config();
const postDirectory = process.env.POST_DIRECTORY;

const MarkdownIt = require("markdown-it");
const md = new MarkdownIt();
const fs = require("fs/promises");
const path = require("path");
const chokidar = require("chokidar");

const postCache = new Map();
chokidar
	.watch(postDirectory, {
		ignoreInitial: true,
		ignorePermissionErrors: true,
	})
	.on("all", (event, filename) => {
		const slug = path.basename(filename).slice(0, -3);
		postCache.delete(slug);
	});

async function getPostFromFile(slug) {
	const filePath = path.join(postDirectory, `${slug}.md`);

	let raw = null;
	try {
		raw = await fs.readFile(filePath, "utf-8");
	} catch (error) {
		console.log(`Error loading post: ${error.message}`);
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

	if (metadata.draft === "yes") {
		return {
			metadata,
			content: "This post is marked as a draft and is not yet available",
		};
	}

	return {
		metadata,
		content,
	};
}

async function GetPostBySlug(slug) {
	if (postCache.has(slug)) {
		return postCache.get(slug);
	}

	let post = await getPostFromFile(slug);

	if (typeof post === "string") {
		return {
			content: post,
		};
	}

	post.content = md.render(post.content);
	postCache.set(slug, post);

	return post;
}

module.exports = {
	GetPostBySlug,
};
