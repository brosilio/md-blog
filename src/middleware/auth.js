const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
	const token = req.cookies?.token;
	if (!token) return res.redirect("/login");

	try {
		req.user = jwt.verify(token, process.env.JWT_SECRET);
		return next();
	} catch {
		res.clearCookie("token");
		return res.redirect("/login");
	}
}

function getAuthUser(req) {
	try {
		return jwt.verify(req.cookies?.token, process.env.JWT_SECRET);
	} catch {
		return null;
	}
}

module.exports = { requireAuth, getAuthUser };
