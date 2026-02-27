const path = require("path");
const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { upload, listFiles, deleteFile, convertToJpeg } = require("../controllers/media");

const blogName = process.env.BLOG_NAME;
const SAFE_FILENAME = /^[a-zA-Z0-9._-]+$/;

function renderPage(res, { username, files, error, uploaded }) {
	res.render("admin-media", { blogName, title: "Media", username, files, error, uploaded });
}

router.get("/media", requireAuth, async (req, res) => {
	const files = await listFiles();
	renderPage(res, {
		username: req.user.username,
		files,
		error: files === null ? "Could not read MEDIA_DIRECTORY — check your .env." : null,
		uploaded: null,
	});
});

router.post("/media/upload", requireAuth, (req, res) => {
	upload.single("file")(req, res, async (err) => {
		if (err || !req.file) {
			const message =
				err?.code === "LIMIT_FILE_SIZE"
					? "File too large (50MB max)."
					: err
					? err.message
					: "No file received or file type not allowed.";
			return renderPage(res, {
				username: req.user.username,
				files: await listFiles(),
				error: message,
				uploaded: null,
			});
		}

		let filename = req.file.filename;

		if (req.body.convert === "jpg") {
			const quality = Math.min(100, Math.max(1, parseInt(req.body.quality) || 85));
			try {
				filename = await convertToJpeg(req.file.path, quality);
			} catch {
				// conversion failed — original file is still on disk, serve it as-is
			}
		}

		renderPage(res, {
			username: req.user.username,
			files: await listFiles(),
			error: null,
			uploaded: { name: filename, url: `/media/${filename}` },
		});
	});
});

router.post("/media/delete/:filename", requireAuth, async (req, res) => {
	const filename = path.basename(req.params.filename);
	if (!SAFE_FILENAME.test(filename)) return res.status(400).send("Invalid filename");
	await deleteFile(filename);
	return res.redirect("/admin/media");
});

module.exports = router;
