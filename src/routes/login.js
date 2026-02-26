const express = require("express");
const router = express.Router();
const { checkCredentials, createToken } = require("../controllers/auth");

const blogName = process.env.BLOG_NAME;

router.get("/login", (req, res) => {
	res.render("login", { blogName, title: "Login", error: null });
});

router.post("/login", express.urlencoded({ extended: false }), (req, res) => {
	const { username, password } = req.body;

	if (!checkCredentials(username, password)) {
		return res.status(401).render("login", {
			blogName,
			title: "Login",
			error: "Invalid credentials",
		});
	}

	res.cookie("token", createToken(username), {
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
