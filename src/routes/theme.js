const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const { requireAuth } = require("../middleware/auth");

const blogName = process.env.BLOG_NAME;
const parseBody = express.urlencoded({ extended: false, limit: "2mb" });

async function readCss() {
	const file = process.env.CUSTOM_CSS_FILE;
	if (!file) return { css: "", configError: true };
	try {
		const css = await fs.readFile(file, "utf-8");
		return { css, configError: false };
	} catch (e) {
		if (e.code === "ENOENT") return { css: "", configError: false };
		throw e;
	}
}

router.get("/theme", requireAuth, async (req, res) => {
	const { css, configError } = await readCss();
	res.render("admin-theme", {
		blogName,
		title: "Theme",
		username: req.user.username,
		css,
		error: configError ? "CUSTOM_CSS_FILE is not set in .env — changes cannot be saved." : null,
		saved: false,
	});
});

router.post("/theme", requireAuth, parseBody, async (req, res) => {
	const file = process.env.CUSTOM_CSS_FILE;
	let error = null;
	let saved = false;

	if (!file) {
		error = "CUSTOM_CSS_FILE is not set in .env — changes cannot be saved.";
	} else {
		try {
			await fs.writeFile(file, req.body.css ?? "", "utf-8");
			saved = true;
		} catch (e) {
			error = `Could not write file: ${e.message}`;
		}
	}

	res.render("admin-theme", {
		blogName,
		title: "Theme",
		username: req.user.username,
		css: req.body.css ?? "",
		error,
		saved,
	});
});

module.exports = router;
