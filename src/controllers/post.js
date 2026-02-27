const postDirectory = process.env.POST_DIRECTORY;

const MarkdownIt = require("markdown-it");
const md = new MarkdownIt();
const fs = require("fs/promises");
const path = require("path");
const chokidar = require("chokidar");

const postCache = new Map();
const metaCache = new Map();
chokidar
	.watch(postDirectory, {
		ignoreInitial: true,
		ignorePermissionErrors: true,
	})
	.on("all", (event, filename) => {
		const slug = path.basename(filename).slice(0, -3);
		postCache.delete(slug);
		metaCache.delete(slug);
	});

function parseRawContent(raw) {
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

async function parsePostFile(slug) {
	const filePath = path.join(postDirectory, `${slug}.md`);
	try {
		return parseRawContent(await fs.readFile(filePath, "utf-8"));
	} catch (error) {
		console.log(`Error loading post: ${error.message}`);
		return false;
	}
}

async function GetPostBySlug(slug, raw = false, admin = false) {
	if (raw) return parsePostFile(slug);

	if (!admin && postCache.has(slug)) return postCache.get(slug);

	const post = await parsePostFile(slug);
	if (!post) return false;

	if (post.metadata?.draft === "yes" && !admin) {
		return {
			metadata: post.metadata,
			content: "This post is marked as a draft and is not yet available",
		};
	}

	post.content = md.render(post.content);
	if (!admin) postCache.set(slug, post);
	return post;
}

const KNOWN_KEYS = new Set(["title", "tags", "draft"]);

function extractFields(metadata) {
	const extraLines = Object.entries(metadata)
		.filter(([k]) => !KNOWN_KEYS.has(k.toLowerCase()))
		.map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
		.join("\n");

	return {
		postTitle: metadata.title || "",
		tags: Array.isArray(metadata.tags)
			? metadata.tags.join(", ")
			: metadata.tags || "",
		draft: metadata.draft === "yes",
		extraMeta: extraLines,
	};
}

function buildRawPost({ postTitle, tags, draft, extraMeta, content }) {
	const lines = [];
	if (postTitle && postTitle.trim()) lines.push(`title: ${postTitle.trim()}`);
	if (tags && tags.trim()) lines.push(`tags: ${tags.trim()}`);
	if (draft) lines.push(`draft: yes`);
	if (extraMeta && extraMeta.trim()) {
		extraMeta
			.trim()
			.split(/\r?\n/)
			.forEach((line) => {
				if (line.trim()) lines.push(line.trim());
			});
	}
	if (lines.length > 0) return lines.join("\n") + "\n\n" + (content || "");
	return content || "";
}

async function deletePost(slug) {
	try {
		await fs.rename(
			path.join(postDirectory, `${slug}.md`),
			path.join(postDirectory, `${slug}.md.deleted`)
		);
		postCache.delete(slug);
		metaCache.delete(slug);
		return true;
	} catch {
		return false;
	}
}

async function undeletePost(slug) {
	try {
		await fs.rename(
			path.join(postDirectory, `${slug}.md.deleted`),
			path.join(postDirectory, `${slug}.md`)
		);
		return true;
	} catch {
		return false;
	}
}

async function permanentlyDeletePost(slug) {
	try {
		await fs.unlink(path.join(postDirectory, `${slug}.md.deleted`));
		return true;
	} catch {
		return false;
	}
}

async function getDeletedPosts() {
	if (!postDirectory) return null;
	try {
		const files = (await fs.readdir(postDirectory)).filter((f) =>
			f.endsWith(".md.deleted")
		);
		return await Promise.all(
			files.map(async (f) => {
				const slug = f.slice(0, -".md.deleted".length);
				try {
					const raw = await fs.readFile(
						path.join(postDirectory, f),
						"utf-8"
					);
					const { metadata } = parseRawContent(raw);
					return { slug, title: metadata.title || slug };
				} catch {
					return { slug, title: slug };
				}
			})
		);
	} catch {
		return null;
	}
}

async function getDeletedPostRaw(slug) {
	try {
		const raw = await fs.readFile(
			path.join(postDirectory, `${slug}.md.deleted`),
			"utf-8"
		);
		return parseRawContent(raw);
	} catch {
		return false;
	}
}

async function updateDeletedPost(slug, fields) {
	const filePath = path.join(postDirectory, `${slug}.md.deleted`);
	try {
		await fs.access(filePath);
	} catch {
		return false;
	}
	await fs.writeFile(filePath, buildRawPost(fields), "utf-8");
	return true;
}

async function postExists(slug) {
	try {
		await fs.access(path.join(postDirectory, `${slug}.md`));
		return true;
	} catch {
		return false;
	}
}

async function writePost(slug, rawContent) {
	await fs.writeFile(
		path.join(postDirectory, `${slug}.md`),
		rawContent,
		"utf-8"
	);
}

async function createPost(slug, fields) {
	if (await postExists(slug)) {
		return { error: `A post with slug "${slug}" already exists.` };
	}
	await writePost(slug, buildRawPost(fields));
	return { error: null };
}

async function updatePost(slug, fields) {
	if (!(await postExists(slug))) return false;
	await writePost(slug, buildRawPost(fields));
	return true;
}

async function getAllPostsMeta() {
	try {
		const files = (await fs.readdir(postDirectory)).filter((f) =>
			f.endsWith(".md")
		);
		const posts = await Promise.all(
			files.map(async (file) => {
				const slug = file.slice(0, -3);
				try {
					if (metaCache.has(slug)) return metaCache.get(slug);
					const [stats, parsed] = await Promise.all([
						fs.stat(path.join(postDirectory, file)),
						parsePostFile(slug),
					]);
					const meta = {
						slug,
						mtime: stats.mtime,
						tags: Array.isArray(parsed?.metadata?.tags)
							? parsed.metadata.tags
							: [],
						title: parsed?.metadata?.title || slug,
					};
					metaCache.set(slug, meta);
					return meta;
				} catch {
					return null;
				}
			})
		);
		return posts.filter(Boolean);
	} catch {
		return null;
	}
}

module.exports = {
	GetPostBySlug,
	getAllPostsMeta,
	extractFields,
	buildRawPost,
	createPost,
	updatePost,
	deletePost,
	undeletePost,
	permanentlyDeletePost,
	getDeletedPosts,
	getDeletedPostRaw,
	updateDeletedPost,
};
