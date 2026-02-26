const crypto = require("crypto");
const fs = require("fs");
const jwt = require("jsonwebtoken");

function loadCredentials() {
	try {
		return JSON.parse(fs.readFileSync(process.env.CREDENTIALS_FILE, "utf-8"));
	} catch {
		return null;
	}
}

function checkCredentials(username, password) {
	const creds = loadCredentials();
	if (!creds) return false;
	const hash = crypto
		.createHash(creds.algo || "sha256")
		.update(`${creds.salt}:${password}`)
		.digest("hex");
	return username === creds.username && hash === creds.passwordHash;
}

function createToken(username) {
	return jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: "8h" });
}

module.exports = { checkCredentials, createToken };
