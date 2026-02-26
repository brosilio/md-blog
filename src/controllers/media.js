const path = require("path");
const fs = require("fs/promises");
const multer = require("multer");

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]);
const ALLOWED_EXTS = new Set([
	".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg",
	".mp4", ".webm",
	".mp3", ".ogg", ".wav",
	".pdf",
]);

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

async function deleteFile(filename) {
	const filePath = path.join(process.env.MEDIA_DIRECTORY, filename);
	try {
		await fs.unlink(filePath);
	} catch {
		// already gone
	}
}

module.exports = { upload, listFiles, deleteFile };
