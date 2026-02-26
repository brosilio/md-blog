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

async function parsePostFile(slug) {
	const filePath = path.join(postDirectory, `${slug}.md`);
	let raw;
	try {
		raw = await fs.readFile(filePath, "utf-8");
	} catch (error) {
		console.log(`Error loading post: ${error.message}`);
		return false;
	}

	const match = raw.match(/\r?\n\r?\n/);
	if (!match) return { metadata: {}, content: raw };

	const metaBlock = raw.slice(0, match.index);
	const content = raw.slice(match.index + match[0].length);

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

	return { metadata, content };
}

async function GetPostBySlug(slug, raw = false) {
	if (raw) return parsePostFile(slug);

	if (postCache.has(slug)) return postCache.get(slug);

	const post = await parsePostFile(slug);
	if (!post) return false;

	if (post.metadata?.draft === "yes") {
		return {
			metadata: post.metadata,
			content: "This post is marked as a draft and is not yet available",
		};
	}

	post.content = md.render(post.content);
	postCache.set(slug, post);
	return post;
}

module.exports = {
	GetPostBySlug,
};
