const crypto = require("crypto");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const express = require("express");
const router = express.Router();

const blogName = process.env.BLOG_NAME;

function loadCredentials() {
	try {
		return JSON.parse(
			fs.readFileSync(process.env.CREDENTIALS_FILE, "utf-8")
		);
	} catch {
		return null;
	}
}

router.get("/login", (req, res) => {
	res.render("login", { blogName, title: "Login", error: null });
});

router.post("/login", express.urlencoded({ extended: false }), (req, res) => {
	const { username, password } = req.body;
	const creds = loadCredentials();

	const renderError = () =>
		res.status(401).render("login", {
			blogName,
			title: "Login",
			error: "Invalid credentials",
		});

	if (!creds) return renderError();

	const hash = crypto
		.createHash(creds.algo || "sha256")
		.update(`${creds.salt}:${password}`)
		.digest("hex");

	if (username !== creds.username || hash !== creds.passwordHash) {
		return renderError();
	}

	const token = jwt.sign({ username }, process.env.JWT_SECRET, {
		expiresIn: "8h",
	});

	res.cookie("token", token, {
		httpOnly: true,
		sameSite: "strict",
		secure: process.env.NODE_ENV === "production",
		maxAge: 8 * 60 * 60 * 1000,
	});

	return res.redirect("/");
});

router.get("/logout", (req, res) => {
	res.clearCookie("token");
	return res.redirect("/");
});

module.exports = router;
