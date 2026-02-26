const path = require("path");
const fs = require("fs/promises");
const express = require("express");
const multer = require("multer");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");

const blogName = process.env.BLOG_NAME;

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]);
const ALLOWED_EXTS = new Set([
	".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg",
	".mp4", ".webm",
	".mp3", ".ogg", ".wav",
	".pdf",
]);
const SAFE_FILENAME = /^[a-zA-Z0-9._-]+$/;

const upload = multer({
	storage: multer.diskStorage({
		destination: (req, file, cb) => cb(null, process.env.MEDIA_DIRECTORY),
		filename: (req, file, cb) => {
			const safe = path.basename(file.originalname).replace(
				/[^a-zA-Z0-9._-]/g,
				"_"
			);
			cb(null, safe);
		},
	}),
	limits: { fileSize: 50 * 1024 * 1024 },
	fileFilter: (req, file, cb) => {
		const ext = path.extname(file.originalname).toLowerCase();
		cb(null, ALLOWED_EXTS.has(ext));
	},
});

async function listFiles() {
	const dir = process.env.MEDIA_DIRECTORY;
	if (!dir) return null;
	try {
		const names = await fs.readdir(dir);
		return names.map((name) => {
			const ext = path.extname(name).toLowerCase();
			return {
				name,
				ext: ext.slice(1) || "file",
				url: `/media/${name}`,
				isImage: IMAGE_EXTS.has(ext),
			};
		});
	} catch {
		return null;
	}
}

function renderPage(res, { username, files, error, uploaded }) {
	res.render("admin-media", {
		blogName,
		title: "Media",
		username,
		files,
		error,
		uploaded,
	});
}

router.get("/media", requireAuth, async (req, res) => {
	const files = await listFiles();
	renderPage(res, {
		username: req.user.username,
		files,
		error: files === null
			? "Could not read MEDIA_DIRECTORY — check your .env."
			: null,
		uploaded: null,
	});
});

router.post("/media/upload", requireAuth, (req, res) => {
	upload.single("file")(req, res, async (err) => {
		const files = await listFiles();

		if (err || !req.file) {
			const message = err?.code === "LIMIT_FILE_SIZE"
				? "File too large (50MB max)."
				: err
				? err.message
				: "No file received or file type not allowed.";
			return renderPage(res, {
				username: req.user.username,
				files,
				error: message,
				uploaded: null,
			});
		}

		renderPage(res, {
			username: req.user.username,
			files,
			error: null,
			uploaded: { name: req.file.filename, url: `/media/${req.file.filename}` },
		});
	});
});

router.post("/media/delete/:filename", requireAuth, async (req, res) => {
	const filename = path.basename(req.params.filename);
	if (!SAFE_FILENAME.test(filename)) return res.status(400).send("Invalid filename");

	const filePath = path.join(process.env.MEDIA_DIRECTORY, filename);
	try {
		await fs.unlink(filePath);
	} catch {
		// already gone — not an error
	}
	return res.redirect("/admin/media");
});

module.exports = router;
